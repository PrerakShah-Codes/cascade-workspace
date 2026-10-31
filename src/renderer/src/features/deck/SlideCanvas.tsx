import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  DeckSlide,
  MathGraphConfig,
  SlideAspectRatio,
  SlideElement
} from '../../../../shared/types';
import { KaTeXRenderer } from '../../components/common/KaTeXRenderer';
import { MermaidRenderer } from '../../components/common/MermaidRenderer';
import { MathGraphWidget } from '../../components/common/MathGraphWidget';
import { ShapeSvgRenderer } from './ShapeLibraryPopover';
import {
  DeckShortcutCommand,
  expandSelectionWithGroups,
  resolveDeckKeyboardCommand
} from './deck-commands';

type ResizeHandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface SlideCanvasProps {
  slide: DeckSlide;
  aspectRatio: SlideAspectRatio;
  selectedElementId: string | null;
  selectedElementIds?: string[];
  onSelectElement: (elementId: string | null) => void;
  onSelectElements?: (elementIds: string[]) => void;
  onUpdateElement: (
    elementId: string,
    updater: (el: SlideElement) => SlideElement
  ) => void;
  onBatchUpdateElements?: (
    updates: Record<
      string,
      Partial<Pick<SlideElement, 'x' | 'y' | 'width' | 'height' | 'content'>>
    >
  ) => void;
  onDeleteElement: (elementId: string) => void;
  onShortcutCommand?: (command: DeckShortcutCommand) => void;
  spellcheckEnabled: boolean;
  readOnly?: boolean;
}

interface InteractionState {
  mode: 'drag' | 'resize';
  handle?: ResizeHandleDir;
  primaryId: string;
  startClientX: number;
  startClientY: number;
  initialRects: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  moved: boolean;
}

/**
 * High-Responsiveness Interactive Slide Canvas:
 * - Uses transient local `draftRects` during 60fps mouse drag & 8-handle resize so full-deck JSON serialization
 *   only executes once on `mouseUp`.
 * - Responsive auto-scaling (`ResizeObserver`) so the 960×540 (16:9) or 960×720 (4:3) logical coordinate space
 *   adapts smoothly whenever sidebars open, close, or drag-resize.
 * - Focusable stage (`tabIndex={0}`) with full keyboard shortcut handling (`Delete`/`Backspace`, `Ctrl+Z`/`Y`,
 *   `Ctrl+C`/`V`, `Ctrl+D`, `Ctrl+G`, arrow nudges) that strictly respects text-editing focus.
 * - Double-click any text or shape element to edit its text inline directly on the slide.
 */
export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  aspectRatio,
  selectedElementId,
  selectedElementIds,
  onSelectElement,
  onSelectElements,
  onUpdateElement,
  onBatchUpdateElements,
  onDeleteElement,
  onShortcutCommand,
  spellcheckEnabled,
  readOnly = false
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const logicalWidth = 960;
  const logicalHeight = aspectRatio === '16:9' ? 540 : 720;

  const [stageScale, setStageScale] = useState<number>(0.92);
  const [canvasFocused, setCanvasFocused] = useState<boolean>(false);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineDraftText, setInlineDraftText] = useState<string>('');
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [draftRects, setDraftRects] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});
  const [snapGuides, setSnapGuides] = useState<{
    verticalCenter: boolean;
    horizontalCenter: boolean;
  }>({ verticalCenter: false, horizontalCenter: false });

  // Normalize selected element IDs from either prop
  const activeSelectedIds: string[] = React.useMemo(() => {
    if (selectedElementIds && selectedElementIds.length > 0) {
      return selectedElementIds;
    }
    return selectedElementId ? [selectedElementId] : [];
  }, [selectedElementId, selectedElementIds]);

  const selectedSet = React.useMemo(
    () => new Set(activeSelectedIds),
    [activeSelectedIds]
  );

  // Clear inline editing if slide or selection changes away
  useEffect(() => {
    if (inlineEditingId && !selectedSet.has(inlineEditingId)) {
      setInlineEditingId(null);
    }
  }, [inlineEditingId, selectedSet, slide.id]);

  // Responsive ResizeObserver scaling so the slide stage adapts to any panel resize
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const computeScale = (): void => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(320, rect.width - 40);
      const availH = Math.max(220, rect.height - 40);
      const scaleX = availW / logicalWidth;
      const scaleY = availH / logicalHeight;
      const nextScale = Math.max(0.35, Math.min(1.25, Math.min(scaleX, scaleY)));
      setStageScale(Number(nextScale.toFixed(3)));
    };

    computeScale();
    const observer = new ResizeObserver(computeScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [logicalWidth, logicalHeight]);

  const setSelection = useCallback(
    (ids: string[]) => {
      if (onSelectElements) {
        onSelectElements(ids);
      } else {
        onSelectElement(ids[0] ?? null);
      }
    },
    [onSelectElement, onSelectElements]
  );

  const commitInlineEdit = useCallback(() => {
    if (!inlineEditingId) return;
    const targetId = inlineEditingId;
    const nextContent = inlineDraftText;
    setInlineEditingId(null);
    onUpdateElement(targetId, (el) => ({
      ...el,
      content: nextContent
    }));
    // Restore focus to canvas after finishing inline text editing
    requestAnimationFrame(() => {
      stageRef.current?.focus();
    });
  }, [inlineEditingId, inlineDraftText, onUpdateElement]);

  // Handle mouse move at 60fps using local `draftRects` (zero full-deck JSON serialization!)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!interaction || readOnly) return;

    const dxLogical = (e.clientX - interaction.startClientX) / stageScale;
    const dyLogical = (e.clientY - interaction.startClientY) / stageScale;

    if (
      !interaction.moved &&
      Math.hypot(dxLogical, dyLogical) < 2
    ) {
      return;
    }

    const nextDrafts: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {};
    let showVGuide = false;
    let showHGuide = false;

    if (interaction.mode === 'drag') {
      for (const [id, init] of Object.entries(interaction.initialRects)) {
        let nextX = Math.round(init.x + dxLogical);
        let nextY = Math.round(init.y + dyLogical);

        // Snap to slide center within 6px
        const elemCenterX = nextX + init.width / 2;
        const elemCenterY = nextY + init.height / 2;
        if (Math.abs(elemCenterX - logicalWidth / 2) <= 6) {
          nextX = Math.round(logicalWidth / 2 - init.width / 2);
          showVGuide = true;
        }
        if (Math.abs(elemCenterY - logicalHeight / 2) <= 6) {
          nextY = Math.round(logicalHeight / 2 - init.height / 2);
          showHGuide = true;
        }

        nextX = Math.max(0, Math.min(logicalWidth - 30, nextX));
        nextY = Math.max(0, Math.min(logicalHeight - 30, nextY));

        nextDrafts[id] = {
          x: nextX,
          y: nextY,
          width: init.width,
          height: init.height
        };
      }
    } else if (interaction.mode === 'resize' && interaction.handle) {
      const init = interaction.initialRects[interaction.primaryId];
      if (init) {
        let { x, y, width, height } = init;
        const h = interaction.handle;
        const minW = 48;
        const minH = 28;

        if (h.includes('e')) {
          width = Math.max(minW, Math.min(logicalWidth - x, Math.round(init.width + dxLogical)));
        }
        if (h.includes('s')) {
          height = Math.max(
            minH,
            Math.min(logicalHeight - y, Math.round(init.height + dyLogical))
          );
        }
        if (h.includes('w')) {
          const proposedW = Math.round(init.width - dxLogical);
          if (proposedW >= minW) {
            x = Math.max(0, Math.round(init.x + dxLogical));
            width = init.x + init.width - x;
          }
        }
        if (h.includes('n')) {
          const proposedH = Math.round(init.height - dyLogical);
          if (proposedH >= minH) {
            y = Math.max(0, Math.round(init.y + dyLogical));
            height = init.y + init.height - y;
          }
        }

        nextDrafts[interaction.primaryId] = { x, y, width, height };
      }
    }

    setInteraction((prev) => (prev ? { ...prev, moved: true } : null));
    setDraftRects(nextDrafts);
    setSnapGuides({ verticalCenter: showVGuide, horizontalCenter: showHGuide });
  };

  const handleMouseUp = (): void => {
    if (!interaction) return;
    const finished = interaction;
    const committedRects = draftRects;

    setInteraction(null);
    setDraftRects({});
    setSnapGuides({ verticalCenter: false, horizontalCenter: false });

    if (!finished.moved || Object.keys(committedRects).length === 0) {
      return;
    }

    if (onBatchUpdateElements) {
      onBatchUpdateElements(committedRects);
    } else {
      for (const [id, rect] of Object.entries(committedRects)) {
        onUpdateElement(id, (el) => ({
          ...el,
          ...rect
        }));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (readOnly) return;

    const cmd = resolveDeckKeyboardCommand({
      key: e.key,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      target: e.target as HTMLElement,
      inlineEditingElementId: inlineEditingId
    });

    if (cmd.type === 'none') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (onShortcutCommand) {
      onShortcutCommand(cmd);
      return;
    }

    // Fallback when used standalone without DeckWorkspace command handler
    if (cmd.type === 'delete' && activeSelectedIds.length > 0) {
      activeSelectedIds.forEach((id) => onDeleteElement(id));
    } else if (cmd.type === 'deselect') {
      setSelection([]);
    }
  };

  const handleElementMouseDown = (
    e: React.MouseEvent,
    el: SlideElement
  ): void => {
    e.stopPropagation();
    if (readOnly) return;

    // Ensure the slide stage receives keyboard focus so Delete/Backspace/Ctrl+Z work immediately!
    stageRef.current?.focus();

    if (inlineEditingId && inlineEditingId !== el.id) {
      commitInlineEdit();
    }

    let nextIds: string[];
    if (e.shiftKey) {
      if (selectedSet.has(el.id)) {
        nextIds = activeSelectedIds.filter((id) => id !== el.id);
      } else {
        nextIds = expandSelectionWithGroups(slide, [...activeSelectedIds, el.id]);
      }
    } else if (selectedSet.has(el.id)) {
      nextIds = activeSelectedIds;
    } else {
      nextIds = expandSelectionWithGroups(slide, [el.id]);
    }

    setSelection(nextIds);

    if (el.locked || inlineEditingId === el.id) return;

    const initialRects: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {};
    for (const item of slide.elements) {
      if (nextIds.includes(item.id) && !item.locked) {
        initialRects[item.id] = {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height
        };
      }
    }

    setInteraction({
      mode: 'drag',
      primaryId: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialRects,
      moved: false
    });
  };

  const handleStartResize = (
    e: React.MouseEvent,
    el: SlideElement,
    handle: ResizeHandleDir
  ): void => {
    e.stopPropagation();
    if (readOnly || el.locked) return;
    stageRef.current?.focus();

    setInteraction({
      mode: 'resize',
      handle,
      primaryId: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialRects: {
        [el.id]: {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height
        }
      },
      moved: false
    });
  };

  const handleElementDoubleClick = (
    e: React.MouseEvent,
    el: SlideElement
  ): void => {
    e.stopPropagation();
    if (readOnly) return;
    if (el.type === 'text' || el.type === 'shape' || el.type === 'latex') {
      setInlineEditingId(el.id);
      setInlineDraftText(el.content);
      setTimeout(() => {
        inlineTextareaRef.current?.focus();
        inlineTextareaRef.current?.select();
      }, 10);
    }
  };

  const resizeHandles: Array<{ dir: ResizeHandleDir; className: string }> = [
    { dir: 'nw', className: '-top-1.5 -left-1.5 cursor-nwse-resize' },
    { dir: 'n', className: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
    { dir: 'ne', className: '-top-1.5 -right-1.5 cursor-nesw-resize' },
    { dir: 'e', className: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize' },
    { dir: 'se', className: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
    { dir: 's', className: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
    { dir: 'sw', className: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
    { dir: 'w', className: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize' }
  ];

  const scaledStageWidth = Math.round(logicalWidth * stageScale);
  const scaledStageHeight = Math.round(logicalHeight * stageScale);

  return (
    <div
      ref={viewportRef}
      tabIndex={readOnly ? -1 : 0}
      onFocus={() => setCanvasFocused(true)}
      onBlur={() => setCanvasFocused(false)}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => {
        if (inlineEditingId) {
          commitInlineEdit();
        }
        setSelection([]);
        stageRef.current?.focus();
      }}
      className="flex-1 flex flex-col items-center justify-center p-4 bg-[#1E1E1E] overflow-hidden relative focus:outline-none select-none"
    >
      {/* Subtle Status & Shortcut Hint Pill */}
      {!readOnly && (
        <div className="mb-2 flex items-center gap-3 text-[11px] text-[#9E9E9E] no-print">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
              canvasFocused
                ? 'bg-[#2A1B3D]/80 border-[#7E42C1] text-[#E6E6E6]'
                : 'bg-[#161616] border-[#2D2D2D] text-[#9E9E9E]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                canvasFocused ? 'bg-emerald-400' : 'bg-[#7E42C1]'
              }`}
            />
            {inlineEditingId
              ? 'Editing Text (Esc or click outside to finish)'
              : activeSelectedIds.length > 0
              ? `${activeSelectedIds.length} object${
                  activeSelectedIds.length > 1 ? 's' : ''
                } selected • Del to delete • Ctrl+D duplicate • Arrows nudge • Double-click to edit text`
              : 'Click any object to select • Shift+Click multi-select • Ctrl+Z / Ctrl+Y undo/redo'}
          </span>
          <span className="font-mono text-[10px]">
            Zoom: {Math.round(stageScale * 100)}%
          </span>
        </div>
      )}

      {/* Scaled Wrapper Container */}
      <div
        style={{
          width: `${scaledStageWidth}px`,
          height: `${scaledStageHeight}px`
        }}
        className="relative shrink-0"
      >
        {/* Logical Coordinate Slide Stage (960x540 or 960x720) */}
        <div
          ref={stageRef}
          tabIndex={readOnly ? -1 : 0}
          onClick={(e) => {
            e.stopPropagation();
            if (inlineEditingId) {
              commitInlineEdit();
            }
            setSelection([]);
            stageRef.current?.focus();
          }}
          style={{
            width: `${logicalWidth}px`,
            height: `${logicalHeight}px`,
            transform: `scale(${stageScale})`,
            transformOrigin: 'top left',
            background: slide.background || '#1E1E1E',
            borderColor: slide.borderAccentColor || '#4A2574'
          }}
          className="relative rounded-xl border-2 shadow-2xl overflow-hidden select-none focus:outline-none"
        >
          {/* Center Alignment Snap Guides */}
          {snapGuides.verticalCenter && (
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#7E42C1] z-50 pointer-events-none" />
          )}
          {snapGuides.horizontalCenter && (
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#7E42C1] z-50 pointer-events-none" />
          )}

          {slide.elements.map((el) => {
            const isSelected = selectedSet.has(el.id);
            const isInlineEditing = inlineEditingId === el.id;
            const draft = draftRects[el.id];
            const x = draft ? draft.x : el.x;
            const y = draft ? draft.y : el.y;
            const width = draft ? draft.width : el.width;
            const height = draft ? draft.height : el.height;

            let parsedMathGraph: MathGraphConfig | null = null;
            if (el.type === 'mathgraph') {
              try {
                parsedMathGraph = JSON.parse(el.content);
              } catch {
                parsedMathGraph = {
                  title: 'Slide Function Plot',
                  xMin: -5,
                  xMax: 5,
                  yMin: -3,
                  yMax: 3,
                  showGrid: true,
                  functions: [{ id: 's1', expression: 'sin(x)', color: '#7E42C1' }]
                };
              }
            }

            return (
              <div
                key={el.id}
                data-element-id={el.id}
                data-element-type={el.type}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
                onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  zIndex: el.zIndex,
                  opacity: el.style?.opacity ?? 1
                }}
                className={`absolute rounded-lg transition-shadow ${
                  readOnly ? '' : 'cursor-move'
                } ${
                  isSelected
                    ? 'ring-2 ring-[#7E42C1] bg-[#2A1B3D]/15'
                    : 'hover:ring-1 hover:ring-[#4A2574]/80'
                }`}
              >
                {/* Group Indicator Tag */}
                {isSelected && el.groupId && (
                  <span className="absolute -top-5 left-0 px-1.5 py-0.2 rounded bg-[#4A2574] text-[9px] font-mono text-[#E6E6E6] pointer-events-none">
                    Group
                  </span>
                )}

                {/* Inline Text Editor (Double-Clicked Text or Shape) */}
                {isInlineEditing ? (
                  <textarea
                    ref={inlineTextareaRef}
                    value={inlineDraftText}
                    spellCheck={spellcheckEnabled}
                    onChange={(e) => setInlineDraftText(e.target.value)}
                    onBlur={commitInlineEdit}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                        e.preventDefault();
                        commitInlineEdit();
                      }
                    }}
                    style={{
                      fontSize: `${el.style?.fontSize || (el.type === 'shape' ? 17 : 22)}px`,
                      fontWeight: el.style?.fontWeight || 'normal',
                      fontStyle: el.style?.fontStyle || 'normal',
                      color: el.style?.color || '#E6E6E6',
                      textAlign: el.style?.textAlign || 'center'
                    }}
                    className="w-full h-full p-2 rounded-lg bg-[#161616]/95 border-2 border-[#7E42C1] text-[#E6E6E6] resize-none focus:outline-none z-30"
                  />
                ) : (
                  <>
                    {/* 1. Text Element */}
                    {el.type === 'text' && (
                      <div
                        style={{
                          fontSize: `${el.style?.fontSize || 22}px`,
                          fontWeight: el.style?.fontWeight || 'normal',
                          fontStyle: el.style?.fontStyle || 'normal',
                          color: el.style?.color || '#E6E6E6',
                          backgroundColor: el.style?.backgroundColor || 'transparent',
                          borderColor: el.style?.borderColor || 'transparent',
                          borderWidth: el.style?.borderColor
                            ? `${el.style?.borderWidth || 1}px`
                            : '0px',
                          borderStyle: el.style?.strokeStyle || 'solid',
                          textAlign: el.style?.textAlign || 'left'
                        }}
                        className="w-full h-full p-2 rounded-lg whitespace-pre-wrap leading-snug flex flex-col justify-center overflow-hidden"
                      >
                        {el.content}
                      </div>
                    )}

                    {/* 2. Vector Shape Element (30+ Shapes) */}
                    {el.type === 'shape' && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <ShapeSvgRenderer
                          kind={el.style?.shapeKind || 'rounded'}
                          fill={el.style?.backgroundColor || '#2A1B3D'}
                          stroke={el.style?.borderColor || '#7E42C1'}
                          strokeWidth={el.style?.borderWidth ?? 2}
                          strokeStyle={el.style?.strokeStyle || 'solid'}
                          borderRadius={el.style?.borderRadius ?? 14}
                          className="absolute inset-0 w-full h-full"
                        />
                        {el.content && (
                          <div
                            style={{
                              fontSize: `${el.style?.fontSize || 17}px`,
                              fontWeight: el.style?.fontWeight || '600',
                              fontStyle: el.style?.fontStyle || 'normal',
                              color: el.style?.color || '#E6E6E6',
                              textAlign: el.style?.textAlign || 'center'
                            }}
                            className="relative z-10 px-4 py-2 whitespace-pre-wrap leading-tight pointer-events-none max-w-full overflow-hidden"
                          >
                            {el.content}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. LaTeX Formula Element */}
                    {el.type === 'latex' && (
                      <div className="w-full h-full flex items-center justify-center overflow-hidden">
                        <KaTeXRenderer latex={el.content} block className="w-full m-0" />
                      </div>
                    )}

                    {/* 4. Mermaid Diagram Element */}
                    {el.type === 'mermaid' && (
                      <div className="w-full h-full overflow-hidden">
                        <MermaidRenderer code={el.content} compact />
                      </div>
                    )}

                    {/* 5. Mathematical Function Graph Element */}
                    {el.type === 'mathgraph' && parsedMathGraph && (
                      <div className="w-full h-full overflow-hidden">
                        <MathGraphWidget config={parsedMathGraph} compact />
                      </div>
                    )}

                    {/* 6. Local Workspace Image Asset Element */}
                    {el.type === 'image' && (
                      <div className="w-full h-full p-3 rounded-lg bg-[#161616] border border-[#4A2574] flex flex-col items-center justify-center gap-2 text-xs text-[#E6E6E6]">
                        <span className="px-2 py-1 rounded bg-[#2A1B3D] text-[#7E42C1] font-mono font-semibold">
                          /assets/ Workspace Media
                        </span>
                        <code className="text-[#E6E6E6] font-mono text-[11px] truncate max-w-full">
                          {el.content}
                        </code>
                      </div>
                    )}
                  </>
                )}

                {/* 8-Direction Resize Handles when selected */}
                {!readOnly && isSelected && !isInlineEditing && activeSelectedIds.length === 1 && (
                  <>
                    {resizeHandles.map((h) => (
                      <div
                        key={h.dir}
                        onMouseDown={(e) => handleStartResize(e, el, h.dir)}
                        className={`absolute w-3 h-3 rounded-sm bg-[#E6E6E6] border-2 border-[#7E42C1] z-30 ${h.className}`}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
