import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DeckDocument,
  DeckSlide,
  ShapeKind,
  SlideElement,
  SlideElementType,
  SlideLayoutPreset
} from '../../../../shared/types';
import { useWorkspaceStore } from '../../store/workspace-store';
import { DeckRibbon } from './DeckRibbon';
import { SlideThumbnails } from './SlideThumbnails';
import { SlideCanvas } from './SlideCanvas';
import { PresenterView } from './PresenterView';
import { ElementInspectorBar } from './ElementInspectorBar';
import { createShapeSlideElement, getShapeCatalogItem } from './shape-catalog';
import {
  alignSelectedElements,
  copySelectedElements,
  createDeckHistory,
  DeckHistoryState,
  DeckShortcutCommand,
  deleteSelectedElements,
  distributeSelectedElements,
  duplicateSelectedElements,
  ElementAlignment,
  groupSelectedElements,
  nudgeSelectedElements,
  pasteClipboardElements,
  pushDeckHistory,
  redoDeckHistory,
  reorderElementLayers,
  resolveDeckKeyboardCommand,
  undoDeckHistory,
  ungroupSelectedElements
} from './deck-commands';

interface DeckWorkspaceProps {
  relativePath: string;
}

/**
 * Complete `.deck` Presentation Studio Workspace with:
 * - Full Undo/Redo history stack (`Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`)
 * - Reliable keyboard shortcuts (`Delete`/`Backspace`, `Ctrl+C`/`V`, `Ctrl+D`, `Ctrl+G`, arrow nudges)
 *   that respect focus and never hijack text inputs or inline shape editing
 * - Categorized 31-shape vector library (`geometric`, `arrows`, `callouts`, `flowchart`)
 * - Preserved session state across panel toggles and tab switches
 */
export const DeckWorkspace: React.FC<DeckWorkspaceProps> = ({
  relativePath
}) => {
  const {
    readFileContent,
    saveFileContent,
    copyExternalAssetToWorkspace,
    setPdfExportModalState,
    addAiMessage,
    setRightAiPanelOpen,
    setStatusMessage,
    deckSessionCache,
    updateDeckSessionCache
  } = useWorkspaceStore();

  const cachedSession = deckSessionCache[relativePath];

  const [history, setHistory] = useState<DeckHistoryState | null>(
    cachedSession?.history || null
  );
  const [activeSlideId, setActiveSlideId] = useState<string>(
    cachedSession?.activeSlideId || ''
  );
  const [selectedSlideIds, setSelectedSlideIds] = useState<Set<string>>(
    () => new Set(cachedSession?.selectedSlideIds || [])
  );
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(
    cachedSession?.selectedElementIds || []
  );
  const [clipboardElements, setClipboardElements] = useState<SlideElement[]>([]);
  const [speakerNotesOpen, setSpeakerNotesOpen] = useState<boolean>(
    cachedSession?.speakerNotesOpen ?? true
  );
  const [navigatorCollapsed, setNavigatorCollapsed] = useState<boolean>(false);
  const [spellcheckEnabled, setSpellcheckEnabled] = useState<boolean>(true);
  const [presenterModeOpen, setPresenterModeOpen] = useState<boolean>(false);

  // Load initial deck from store or session cache
  useEffect(() => {
    let active = true;
    readFileContent(relativePath).then((raw) => {
      if (!active) return;
      try {
        const parsed: DeckDocument = JSON.parse(raw);
        setHistory((prev) => {
          if (prev && prev.present.title === parsed.title) {
            return prev;
          }
          return createDeckHistory(parsed);
        });
        setActiveSlideId((prevId) => {
          if (prevId && parsed.slides.some((s) => s.id === prevId)) {
            return prevId;
          }
          const firstId = parsed.slides[0]?.id || '';
          setSelectedSlideIds(new Set(firstId ? [firstId] : []));
          return firstId;
        });
      } catch {
        // Ignore parse error on empty draft
      }
    });
    return () => {
      active = false;
    };
  }, [relativePath, readFileContent]);

  // Persist session state into workspace store cache so toggling panels or switching tabs
  // preserves selection, active slide, and undo history
  useEffect(() => {
    if (!history) return;
    updateDeckSessionCache(relativePath, {
      activeSlideId,
      selectedSlideIds: Array.from(selectedSlideIds),
      selectedElementIds,
      speakerNotesOpen,
      history
    });
  }, [
    relativePath,
    activeSlideId,
    selectedSlideIds,
    selectedElementIds,
    speakerNotesOpen,
    history,
    updateDeckSessionCache
  ]);

  const deck = history?.present || null;

  const commitDeckUpdate = useCallback(
    (
      nextDeck: DeckDocument,
      options?: { recordHistory?: boolean; statusMsg?: string }
    ): void => {
      const recordHistory = options?.recordHistory ?? true;
      const withTimestamp: DeckDocument = {
        ...nextDeck,
        updatedAt: new Date().toISOString()
      };

      setHistory((prev) => {
        if (!prev) return createDeckHistory(withTimestamp);
        if (!recordHistory) {
          return {
            ...prev,
            present: withTimestamp
          };
        }
        return pushDeckHistory(prev, withTimestamp);
      });

      saveFileContent(relativePath, JSON.stringify(withTimestamp, null, 2));
      if (options?.statusMsg) {
        setStatusMessage(options.statusMsg);
      }
    },
    [relativePath, saveFileContent, setStatusMessage]
  );

  const activeSlideIndex = deck
    ? Math.max(
        0,
        deck.slides.findIndex((s) => s.id === activeSlideId)
      )
    : 0;
  const activeSlide = deck
    ? deck.slides[activeSlideIndex] || deck.slides[0]
    : null;

  const updateActiveSlide = useCallback(
    (
      updater: (slide: DeckSlide) => DeckSlide,
      options?: { recordHistory?: boolean; statusMsg?: string }
    ): void => {
      if (!deck || !activeSlide) return;
      const updatedSlide = updater(activeSlide);
      commitDeckUpdate(
        {
          ...deck,
          slides: deck.slides.map((s) =>
            s.id === activeSlide.id ? updatedSlide : s
          )
        },
        options
      );
    },
    [deck, activeSlide, commitDeckUpdate]
  );

  // Undo / Redo / Copy / Paste / Duplicate / Delete Handlers
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (!prev || prev.past.length === 0) return prev;
      const next = undoDeckHistory(prev);
      saveFileContent(relativePath, JSON.stringify(next.present, null, 2));
      setStatusMessage('Undid presentation action (Ctrl+Z)');
      return next;
    });
  }, [relativePath, saveFileContent, setStatusMessage]);

  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (!prev || prev.future.length === 0) return prev;
      const next = redoDeckHistory(prev);
      saveFileContent(relativePath, JSON.stringify(next.present, null, 2));
      setStatusMessage('Redid presentation action (Ctrl+Y)');
      return next;
    });
  }, [relativePath, saveFileContent, setStatusMessage]);

  const handleDeleteSelectedElements = useCallback(() => {
    if (!activeSlide || selectedElementIds.length === 0) return;
    const { slide: updatedSlide, deletedCount } = deleteSelectedElements(
      activeSlide,
      selectedElementIds
    );
    if (deletedCount > 0) {
      updateActiveSlide(() => updatedSlide, {
        statusMsg: `Deleted ${deletedCount} slide object${deletedCount > 1 ? 's' : ''}`
      });
      setSelectedElementIds([]);
    }
  }, [activeSlide, selectedElementIds, updateActiveSlide]);

  const handleCopySelectedElements = useCallback(() => {
    if (!activeSlide || selectedElementIds.length === 0) return;
    const copied = copySelectedElements(activeSlide, selectedElementIds);
    setClipboardElements(copied);
    setStatusMessage(`Copied ${copied.length} slide object${copied.length > 1 ? 's' : ''}`);
  }, [activeSlide, selectedElementIds, setStatusMessage]);

  const handlePasteElements = useCallback(() => {
    if (!activeSlide || clipboardElements.length === 0) return;
    const { slide: updatedSlide, newElementIds } = pasteClipboardElements(
      activeSlide,
      clipboardElements,
      24
    );
    updateActiveSlide(() => updatedSlide, {
      statusMsg: `Pasted ${newElementIds.length} slide object${
        newElementIds.length > 1 ? 's' : ''
      }`
    });
    setSelectedElementIds(newElementIds);
  }, [activeSlide, clipboardElements, updateActiveSlide]);

  const handleDuplicateSelectedElements = useCallback(() => {
    if (!activeSlide || selectedElementIds.length === 0) return;
    const { slide: updatedSlide, newElementIds } = duplicateSelectedElements(
      activeSlide,
      selectedElementIds,
      24
    );
    updateActiveSlide(() => updatedSlide, {
      statusMsg: `Duplicated ${newElementIds.length} slide object${
        newElementIds.length > 1 ? 's' : ''
      }`
    });
    setSelectedElementIds(newElementIds);
  }, [activeSlide, selectedElementIds, updateActiveSlide]);

  const handleAlignSelected = useCallback(
    (alignment: ElementAlignment) => {
      if (!activeSlide || selectedElementIds.length === 0) return;
      const stageH = deck?.theme.aspectRatio === '4:3' ? 720 : 540;
      updateActiveSlide(
        (s) => alignSelectedElements(s, selectedElementIds, alignment, 960, stageH),
        { statusMsg: `Aligned selection (${alignment})` }
      );
    },
    [activeSlide, selectedElementIds, deck?.theme.aspectRatio, updateActiveSlide]
  );

  const handleDistributeSelected = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      if (!activeSlide || selectedElementIds.length < 3) return;
      updateActiveSlide(
        (s) => distributeSelectedElements(s, selectedElementIds, axis),
        { statusMsg: `Distributed objects (${axis})` }
      );
    },
    [activeSlide, selectedElementIds, updateActiveSlide]
  );

  const handleReorderLayer = useCallback(
    (action: 'front' | 'back' | 'forward' | 'backward') => {
      if (!activeSlide || selectedElementIds.length === 0) return;
      updateActiveSlide(
        (s) => reorderElementLayers(s, selectedElementIds, action),
        { statusMsg: `Updated object layer order (${action})` }
      );
    },
    [activeSlide, selectedElementIds, updateActiveSlide]
  );

  const handleGroupSelected = useCallback(() => {
    if (!activeSlide || selectedElementIds.length < 2) return;
    const { slide: updatedSlide } = groupSelectedElements(
      activeSlide,
      selectedElementIds
    );
    updateActiveSlide(() => updatedSlide, {
      statusMsg: `Grouped ${selectedElementIds.length} objects (Ctrl+G)`
    });
  }, [activeSlide, selectedElementIds, updateActiveSlide]);

  const handleUngroupSelected = useCallback(() => {
    if (!activeSlide || selectedElementIds.length === 0) return;
    updateActiveSlide(
      (s) => ungroupSelectedElements(s, selectedElementIds),
      { statusMsg: 'Ungrouped selected objects (Ctrl+Shift+G)' }
    );
  }, [activeSlide, selectedElementIds, updateActiveSlide]);

  const executeShortcutCommand = useCallback(
    (cmd: DeckShortcutCommand) => {
      if (!activeSlide) return;
      switch (cmd.type) {
        case 'delete':
          handleDeleteSelectedElements();
          break;
        case 'undo':
          handleUndo();
          break;
        case 'redo':
          handleRedo();
          break;
        case 'copy':
          handleCopySelectedElements();
          break;
        case 'paste':
          handlePasteElements();
          break;
        case 'duplicate':
          handleDuplicateSelectedElements();
          break;
        case 'select-all':
          setSelectedElementIds(activeSlide.elements.map((e) => e.id));
          break;
        case 'deselect':
          setSelectedElementIds([]);
          break;
        case 'group':
          handleGroupSelected();
          break;
        case 'ungroup':
          handleUngroupSelected();
          break;
        case 'nudge': {
          const stageH = deck?.theme.aspectRatio === '4:3' ? 720 : 540;
          updateActiveSlide((s) =>
            nudgeSelectedElements(
              s,
              selectedElementIds,
              cmd.dx,
              cmd.dy,
              960,
              stageH
            )
          );
          break;
        }
        default:
          break;
      }
    },
    [
      activeSlide,
      deck?.theme.aspectRatio,
      handleCopySelectedElements,
      handleDeleteSelectedElements,
      handleDuplicateSelectedElements,
      handleGroupSelected,
      handlePasteElements,
      handleRedo,
      handleUndo,
      handleUngroupSelected,
      selectedElementIds,
      updateActiveSlide
    ]
  );

  // Global fallback listener when presentation workspace is mounted and an object is selected,
  // while strictly guarding against active inputs/textareas/contentEditable!
  const executeShortcutRef = useRef(executeShortcutCommand);
  executeShortcutRef.current = executeShortcutCommand;

  useEffect(() => {
    if (presenterModeOpen) return;
    const onWindowKeyDown = (e: KeyboardEvent): void => {
      if (e.defaultPrevented) return;
      const cmd = resolveDeckKeyboardCommand({
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        target: (e.target as HTMLElement) || (document.activeElement as HTMLElement)
      });
      if (cmd.type === 'none') return;
      e.preventDefault();
      executeShortcutRef.current(cmd);
    };
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [presenterModeOpen]);

  if (!deck || !activeSlide) {
    return (
      <div className="p-6 text-xs text-[#9E9E9E]">
        Loading presentation studio ({relativePath})…
      </div>
    );
  }

  const handleNewSlide = (layout: SlideLayoutPreset = 'title-content'): void => {
    const now = Date.now();
    const newSlide: DeckSlide = {
      id: `slide-${now}`,
      title: `Slide ${deck.slides.length + 1} (${layout})`,
      layout,
      background: deck.theme.defaultBackground || '#1E1E1E',
      borderAccentColor: '#4A2574',
      transition: { type: 'fade', durationMs: 400 },
      speakerNotes: 'Add speaker notes for this slide...',
      elements:
        layout === 'blank'
          ? []
          : [
              {
                id: `el-heading-${now}`,
                type: 'text',
                x: 60,
                y: 40,
                width: 840,
                height: 60,
                zIndex: 1,
                content: `Slide ${deck.slides.length + 1}: Technical Assertion Headline`,
                style: {
                  fontSize: 30,
                  fontWeight: 'bold',
                  color: '#E6E6E6',
                  textAlign: 'left'
                }
              }
            ]
    };

    if (layout === 'title-content') {
      newSlide.elements.push({
        id: `el-body-${now}`,
        type: 'text',
        x: 60,
        y: 125,
        width: 840,
        height: 220,
        zIndex: 2,
        content:
          '• Key architectural invariant and sub-millisecond performance target\n• Deterministic local SQLite storage with zero external cloud dependencies\n• Double-click any text block or shape to edit inline',
        style: { fontSize: 20, color: '#E6E6E6', textAlign: 'left' }
      });
    } else if (layout === 'two-column' || layout === 'comparison') {
      newSlide.elements.push(
        {
          id: `el-col1-${now}`,
          type: 'shape',
          x: 60,
          y: 125,
          width: 405,
          height: 320,
          zIndex: 2,
          content: 'Left Column / Baseline Architecture',
          style: {
            shapeKind: 'rounded',
            backgroundColor: '#161616',
            borderColor: '#4A2574',
            borderWidth: 2,
            color: '#E6E6E6',
            fontSize: 18,
            textAlign: 'center'
          }
        },
        {
          id: `el-col2-${now}`,
          type: 'shape',
          x: 495,
          y: 125,
          width: 405,
          height: 320,
          zIndex: 3,
          content: 'Right Column / Optimized Pipeline',
          style: {
            shapeKind: 'rounded',
            backgroundColor: '#2A1B3D',
            borderColor: '#7E42C1',
            borderWidth: 2,
            color: '#E6E6E6',
            fontSize: 18,
            textAlign: 'center'
          }
        }
      );
    } else if (layout === 'math-focus') {
      newSlide.elements.push({
        id: `el-latex-${now}`,
        type: 'latex',
        x: 60,
        y: 140,
        width: 840,
        height: 120,
        zIndex: 2,
        content:
          '\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}'
      });
    } else if (layout === 'diagram-focus') {
      newSlide.elements.push({
        id: `el-merm-${now}`,
        type: 'mermaid',
        x: 60,
        y: 130,
        width: 840,
        height: 300,
        zIndex: 2,
        content:
          'flowchart LR\n  A[Client Request] --> B[SQLite Engine]\n  B --> C[Slide Render]'
      });
    }

    const updatedSlides = [...deck.slides, newSlide];
    commitDeckUpdate(
      { ...deck, slides: updatedSlides },
      { statusMsg: `Added new slide (${layout})` }
    );
    setActiveSlideId(newSlide.id);
    setSelectedSlideIds(new Set([newSlide.id]));
    setSelectedElementIds([]);
  };

  const handleDuplicateSlide = (): void => {
    const copy: DeckSlide = {
      ...JSON.parse(JSON.stringify(activeSlide)),
      id: `slide-copy-${Date.now()}`,
      title: `${activeSlide.title} (Copy)`
    };
    const nextSlides = [...deck.slides];
    nextSlides.splice(activeSlideIndex + 1, 0, copy);
    commitDeckUpdate(
      { ...deck, slides: nextSlides },
      { statusMsg: `Duplicated slide "${activeSlide.title}"` }
    );
    setActiveSlideId(copy.id);
  };

  const handleDeleteSlide = (): void => {
    if (deck.slides.length <= 1) {
      setStatusMessage('A presentation must contain at least 1 slide.');
      return;
    }
    const nextSlides = deck.slides.filter((s) => s.id !== activeSlide.id);
    commitDeckUpdate(
      { ...deck, slides: nextSlides },
      { statusMsg: `Deleted slide "${activeSlide.title}"` }
    );
    setActiveSlideId(nextSlides[0].id);
    setSelectedElementIds([]);
  };

  const handleInsertShape = (kind: ShapeKind): void => {
    const spec = getShapeCatalogItem(kind);
    const nextZ =
      activeSlide.elements.reduce((m, el) => Math.max(m, el.zIndex), 0) + 1;
    const newShapeEl = createShapeSlideElement(
      kind,
      nextZ,
      activeSlide.elements.length
    );

    updateActiveSlide(
      (s) => ({
        ...s,
        elements: [...s.elements, newShapeEl]
      }),
      { statusMsg: `Inserted ${spec.label} shape` }
    );
    setSelectedElementIds([newShapeEl.id]);
  };

  const handleInsertElement = async (type: SlideElementType): Promise<void> => {
    if (type === 'shape') {
      handleInsertShape('rounded');
      return;
    }

    let defaultContent = 'Editable Slide Text Block';
    if (type === 'image') {
      defaultContent = await copyExternalAssetToWorkspace('slide-graphic.svg');
    } else if (type === 'latex') {
      defaultContent = '\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}';
    } else if (type === 'mermaid') {
      defaultContent =
        'flowchart LR\n  NodeA[Input] --> NodeB[Transform] --> NodeC[Output]';
    } else if (type === 'mathgraph') {
      defaultContent = JSON.stringify({
        title: 'Slide Function Plot f(x)',
        xMin: -5,
        xMax: 5,
        yMin: -3,
        yMax: 3,
        showGrid: true,
        functions: [
          { id: 'f1', expression: 'sin(x) * 2', color: '#7E42C1', label: '2sin(x)' }
        ]
      });
    }

    const nextZ =
      activeSlide.elements.reduce((m, el) => Math.max(m, el.zIndex), 0) + 1;

    const newElement: SlideElement = {
      id: `el-${Date.now()}`,
      type,
      x: 90,
      y: 150,
      width: type === 'mathgraph' || type === 'mermaid' ? 520 : 460,
      height: type === 'mathgraph' || type === 'mermaid' ? 280 : 105,
      zIndex: nextZ,
      content: defaultContent,
      style: {
        fontSize: 22,
        color: '#E6E6E6',
        textAlign: 'left'
      }
    };

    updateActiveSlide(
      (s) => ({
        ...s,
        elements: [...s.elements, newElement]
      }),
      { statusMsg: `Inserted ${type} object onto slide` }
    );
    setSelectedElementIds([newElement.id]);
  };

  const handleMoveSlide = (idx: number, direction: 'up' | 'down'): void => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= deck.slides.length) return;
    const copy = [...deck.slides];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    commitDeckUpdate({ ...deck, slides: copy });
  };

  const handleRequestAiSlideCritique = (): void => {
    setRightAiPanelOpen(true);
    addAiMessage({
      id: `msg-critique-${Date.now()}`,
      role: 'assistant',
      content: `**Slide Review Critique for "${activeSlide.title}"**:\n• Strong contrast on \`#1E1E1E\` canvas with \`#4A2574\` accent border.\n• Recommendation: Add a quantitative benchmark slide next. Click **[✓ Approve & Apply]** below if you'd like to insert the synthesized slide.`,
      createdAt: new Date().toISOString(),
      citations: [
        {
          relativePath,
          fileName: relativePath.split('/').pop() || relativePath,
          snippet: activeSlide.title
        }
      ],
      proposals: [
        {
          id: `prop-critique-${Date.now()}`,
          type: 'insert_deck_slide',
          targetRelativePath: relativePath,
          title: 'Insert Quantitative Synthesis Slide',
          summary: 'Adds a follow-up slide with KaTeX formula and executive takeaways.',
          payload: {
            slide: {
              id: `slide-ai-${Date.now()}`,
              title: 'Quantitative Performance Synthesis',
              layout: 'math-focus',
              background: 'linear-gradient(135deg, #1E1E1E 0%, #2A1B3D 100%)',
              borderAccentColor: '#7E42C1',
              transition: { type: 'fade', durationMs: 400 },
              speakerNotes: 'AI-proposed follow-up slide approved by user.',
              elements: [
                {
                  id: `el-ai-${Date.now()}`,
                  type: 'text',
                  x: 60,
                  y: 50,
                  width: 840,
                  height: 60,
                  zIndex: 1,
                  content: 'Quantitative Performance Synthesis',
                  style: { fontSize: 32, fontWeight: 'bold', color: '#E6E6E6' }
                },
                {
                  id: `el-ai-math-${Date.now()}`,
                  type: 'latex',
                  x: 60,
                  y: 150,
                  width: 840,
                  height: 120,
                  zIndex: 2,
                  content: 'S(p) = \\frac{1}{(1 - p) + \\frac{p}{N}}'
                }
              ]
            }
          },
          status: 'pending'
        }
      ]
    });
  };

  const selectedElements = activeSlide.elements.filter((el) =>
    selectedElementIds.includes(el.id)
  );

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E] min-w-0">
      <DeckRibbon
        onNewSlide={handleNewSlide}
        onDeleteSlide={handleDeleteSlide}
        onDuplicateSlide={handleDuplicateSlide}
        onInsertElement={handleInsertElement}
        onInsertShape={handleInsertShape}
        canUndo={Boolean(history && history.past.length > 0)}
        canRedo={Boolean(history && history.future.length > 0)}
        hasSelection={selectedElementIds.length > 0}
        selectionCount={selectedElementIds.length}
        hasClipboard={clipboardElements.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopySelectedElements}
        onPaste={handlePasteElements}
        onDuplicateSelection={handleDuplicateSelectedElements}
        onDeleteSelection={handleDeleteSelectedElements}
        onAlignSelection={handleAlignSelected}
        onDistributeSelection={handleDistributeSelected}
        onReorderLayer={handleReorderLayer}
        onGroupSelection={handleGroupSelected}
        onUngroupSelection={handleUngroupSelected}
        onBackgroundChange={(bg) =>
          updateActiveSlide((s) => ({ ...s, background: bg }))
        }
        aspectRatio={deck.theme.aspectRatio}
        onAspectRatioChange={(ratio) =>
          commitDeckUpdate({
            ...deck,
            theme: { ...deck.theme, aspectRatio: ratio }
          })
        }
        borderAccent={activeSlide.borderAccentColor || '#4A2574'}
        onBorderAccentChange={(color) =>
          updateActiveSlide((s) => ({ ...s, borderAccentColor: color }))
        }
        transitionType={activeSlide.transition.type || 'fade'}
        transitionDurationMs={activeSlide.transition.durationMs || 400}
        onTransitionChange={(type, durationMs) =>
          updateActiveSlide((s) => ({
            ...s,
            transition: { type, durationMs }
          }))
        }
        speakerNotesOpen={speakerNotesOpen}
        onToggleSpeakerNotes={() => setSpeakerNotesOpen((v) => !v)}
        spellcheckEnabled={spellcheckEnabled}
        onToggleSpellcheck={() => setSpellcheckEnabled((v) => !v)}
        onRequestAiSlideCritique={handleRequestAiSlideCritique}
        onStartPresenter={() => setPresenterModeOpen(true)}
        onExportPdf={() =>
          setPdfExportModalState({
            open: true,
            mode: 'deck',
            customTitle: deck.title
          })
        }
      />

      {/* Contextual Formatting & Shape Styling Bar when 1+ elements are selected */}
      <ElementInspectorBar
        selectedElements={selectedElements}
        spellcheckEnabled={spellcheckEnabled}
        onUpdateSelected={(updater) => {
          const idSet = new Set(selectedElementIds);
          updateActiveSlide((s) => ({
            ...s,
            elements: s.elements.map((el) =>
              idSet.has(el.id) ? updater(el) : el
            )
          }));
        }}
        onAlignSelected={handleAlignSelected}
        onDistributeSelected={handleDistributeSelected}
        onReorderLayer={handleReorderLayer}
        onGroupSelected={handleGroupSelected}
        onUngroupSelected={handleUngroupSelected}
        onDuplicateSelected={handleDuplicateSelectedElements}
        onDeleteSelected={handleDeleteSelectedElements}
      />

      <div className="flex-1 flex min-h-0 min-w-0">
        <SlideThumbnails
          slides={deck.slides}
          activeSlideId={activeSlide.id}
          selectedSlideIds={selectedSlideIds}
          collapsed={navigatorCollapsed}
          onToggleCollapsed={() => setNavigatorCollapsed((v) => !v)}
          onSelectSlide={(slideId, multi) => {
            setActiveSlideId(slideId);
            setSelectedElementIds([]);
            if (multi) {
              setSelectedSlideIds((prev) => {
                const next = new Set(prev);
                if (next.has(slideId)) next.delete(slideId);
                else next.add(slideId);
                return next;
              });
            } else {
              setSelectedSlideIds(new Set([slideId]));
            }
          }}
          onMoveSlide={handleMoveSlide}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <SlideCanvas
            slide={activeSlide}
            aspectRatio={deck.theme.aspectRatio}
            selectedElementId={selectedElementIds[0] ?? null}
            selectedElementIds={selectedElementIds}
            onSelectElement={(id) => setSelectedElementIds(id ? [id] : [])}
            onSelectElements={setSelectedElementIds}
            onUpdateElement={(elId, updater) =>
              updateActiveSlide((s) => ({
                ...s,
                elements: s.elements.map((el) =>
                  el.id === elId ? updater(el) : el
                )
              }))
            }
            onBatchUpdateElements={(updates) =>
              updateActiveSlide((s) => ({
                ...s,
                elements: s.elements.map((el) =>
                  updates[el.id] ? { ...el, ...updates[el.id] } : el
                )
              }))
            }
            onDeleteElement={(elId) => {
              updateActiveSlide((s) => ({
                ...s,
                elements: s.elements.filter((el) => el.id !== elId)
              }));
              setSelectedElementIds((prev) => prev.filter((id) => id !== elId));
            }}
            onShortcutCommand={executeShortcutCommand}
            spellcheckEnabled={spellcheckEnabled}
          />

          {/* Speaker Notes Drawer */}
          {speakerNotesOpen && (
            <div className="h-24 shrink-0 bg-[#161616] border-t border-[#2D2D2D] p-2 flex flex-col no-print">
              <div className="flex items-center justify-between text-[11px] text-[#9E9E9E] mb-1">
                <span className="font-semibold text-[#7E42C1]">
                  SPEAKER NOTES — {activeSlide.title}
                </span>
                <div className="flex items-center gap-2">
                  <span>Slide transition: {activeSlide.transition.type}</span>
                  <button
                    type="button"
                    onClick={() => setSpeakerNotesOpen(false)}
                    className="px-1.5 py-0.2 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6]"
                  >
                    Hide
                  </button>
                </div>
              </div>
              <textarea
                value={activeSlide.speakerNotes}
                spellCheck={spellcheckEnabled}
                onChange={(e) =>
                  updateActiveSlide(
                    (s) => ({
                      ...s,
                      speakerNotes: e.target.value
                    }),
                    { recordHistory: false }
                  )
                }
                placeholder="Write speaker notes for presenter view and PDF handout..."
                className="flex-1 w-full bg-[#1E1E1E] border border-[#2D2D2D] rounded p-1.5 text-xs text-[#E6E6E6] resize-none focus:outline-none focus:border-[#4A2574]"
              />
            </div>
          )}
        </div>
      </div>

      {presenterModeOpen && (
        <PresenterView
          deck={deck}
          initialSlideIndex={activeSlideIndex}
          onExit={() => setPresenterModeOpen(false)}
        />
      )}
    </div>
  );
};
