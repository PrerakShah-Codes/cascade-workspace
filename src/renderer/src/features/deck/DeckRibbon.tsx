import React, { useState } from 'react';
import {
  ShapeKind,
  SlideAspectRatio,
  SlideElementType,
  SlideLayoutPreset,
  SlideTransitionType
} from '../../../../shared/types';
import { ShapeLibraryPopover, ShapeSvgRenderer } from './ShapeLibraryPopover';
import { ElementAlignment } from './deck-commands';

export type DeckRibbonTab =
  | 'Home'
  | 'Insert'
  | 'Arrange'
  | 'Design'
  | 'Transitions'
  | 'Review';

interface DeckRibbonProps {
  onNewSlide: (layout?: SlideLayoutPreset) => void;
  onDeleteSlide: () => void;
  onDuplicateSlide: () => void;
  onInsertElement: (type: SlideElementType) => void;
  onInsertShape: (kind: ShapeKind) => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  selectionCount: number;
  hasClipboard: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicateSelection: () => void;
  onDeleteSelection: () => void;
  onAlignSelection: (alignment: ElementAlignment) => void;
  onDistributeSelection: (axis: 'horizontal' | 'vertical') => void;
  onReorderLayer: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onGroupSelection: () => void;
  onUngroupSelection: () => void;
  onBackgroundChange: (bg: string) => void;
  aspectRatio: SlideAspectRatio;
  onAspectRatioChange: (ratio: SlideAspectRatio) => void;
  borderAccent: string;
  onBorderAccentChange: (color: string) => void;
  transitionType: SlideTransitionType;
  transitionDurationMs: number;
  onTransitionChange: (type: SlideTransitionType, durationMs: number) => void;
  speakerNotesOpen: boolean;
  onToggleSpeakerNotes: () => void;
  spellcheckEnabled: boolean;
  onToggleSpellcheck: () => void;
  onRequestAiSlideCritique: () => void;
  onStartPresenter: () => void;
  onExportPdf: () => void;
}

const QUICK_SHAPES: Array<{ kind: ShapeKind; label: string }> = [
  { kind: 'rectangle', label: 'Rectangle' },
  { kind: 'rounded', label: 'Rounded Rectangle' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'diamond', label: 'Diamond' },
  { kind: 'hexagon', label: 'Hexagon' },
  { kind: 'line', label: 'Line' },
  { kind: 'arrow-right', label: 'Right Arrow' },
  { kind: 'arrow-both', label: 'Bi-Directional Arrow' },
  { kind: 'callout', label: 'Speech Callout' },
  { kind: 'flow-process', label: 'Flowchart Process' },
  { kind: 'flow-decision', label: 'Flowchart Decision' },
  { kind: 'flow-database', label: 'Database Cylinder' }
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E42C1]';

/**
 * Contextual Presentation Ribbon for `.deck` studio.
 * Uses accessible visual SVG icons for all text-adding and shape-insertion tools.
 */
export const DeckRibbon: React.FC<DeckRibbonProps> = ({
  onNewSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onInsertElement,
  onInsertShape,
  canUndo,
  canRedo,
  hasSelection,
  selectionCount,
  hasClipboard,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicateSelection,
  onDeleteSelection,
  onAlignSelection,
  onDistributeSelection,
  onReorderLayer,
  onGroupSelection,
  onUngroupSelection,
  onBackgroundChange,
  aspectRatio,
  onAspectRatioChange,
  borderAccent,
  onBorderAccentChange,
  transitionType,
  transitionDurationMs,
  onTransitionChange,
  speakerNotesOpen,
  onToggleSpeakerNotes,
  spellcheckEnabled,
  onToggleSpellcheck,
  onRequestAiSlideCritique,
  onStartPresenter,
  onExportPdf
}) => {
  const [activeRibbonTab, setActiveRibbonTab] = useState<DeckRibbonTab>('Home');
  const [shapePopoverOpen, setShapePopoverOpen] = useState<boolean>(false);

  const tabs: DeckRibbonTab[] = [
    'Home',
    'Insert',
    'Arrange',
    'Design',
    'Transitions',
    'Review'
  ];

  const renderAddTextBoxIconButton = (prominent = false): React.ReactNode => (
    <button
      type="button"
      onClick={() => onInsertElement('text')}
      aria-label="Insert Text Box"
      title="Insert Text Box"
      className={`h-7 px-2 rounded flex items-center justify-center gap-1 transition-colors border ${FOCUS_RING} ${
        prominent
          ? 'bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border-[#7E42C1]'
          : 'bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border-[#4A2574]'
      }`}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" strokeDasharray="3 2" />
        <path d="M8 9h8M12 9v7M10 16h4" />
      </svg>
    </button>
  );

  const renderShapeLibraryTrigger = (): React.ReactNode => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShapePopoverOpen((v) => !v)}
        aria-label="Open Shape Library (31 Shapes)"
        aria-expanded={shapePopoverOpen}
        title="Insert Shape — Open Shape Library (31 Shapes)"
        className={`h-7 px-2 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#7E42C1] flex items-center gap-1 transition-colors ${FOCUS_RING}`}
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <circle cx="16.5" cy="7.5" r="4.5" />
          <polygon points="12,13 17,21 7,21" />
        </svg>
        <svg
          className="w-3 h-3 text-[#9E9E9E]"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.5 7.5L10 12l4.5-4.5" />
        </svg>
      </button>
      {shapePopoverOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50">
          <ShapeLibraryPopover
            onSelectShape={(kind) => onInsertShape(kind)}
            onClose={() => setShapePopoverOpen(false)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-[#161616] border-b border-[#2D2D2D] select-none no-print relative z-30">
      {/* Top Ribbon Tab Strip + Persistent Icon Controls */}
      <div className="px-3 pt-1.5 flex items-center justify-between border-b border-[#2D2D2D]">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeRibbonTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveRibbonTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${FOCUS_RING} ${
                  isActive
                    ? 'bg-[#2A1B3D] text-[#E6E6E6] border-t border-x border-[#4A2574]'
                    : 'text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E]'
                }`}
              >
                {tab}
              </button>
            );
          })}

          {/* Always-visible Quick Undo / Redo / Duplicate / Delete Icon Strip */}
          <div className="ml-3 pl-3 border-l border-[#2D2D2D] flex items-center gap-1 pb-1">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              aria-label="Undo (Ctrl+Z)"
              title="Undo (Ctrl+Z)"
              className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center disabled:opacity-35 ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              aria-label="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center disabled:opacity-35 ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={onDuplicateSelection}
              aria-label="Duplicate Selected Object (Ctrl+D)"
              title="Duplicate Selected Object (Ctrl+D)"
              className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center disabled:opacity-35 ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={onDeleteSelection}
              aria-label="Delete Selected Slide Object (Delete / Backspace)"
              title="Delete Selected Slide Object (Delete / Backspace)"
              className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-red-950/70 text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center disabled:opacity-35 ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-1">
          <button
            type="button"
            onClick={onStartPresenter}
            aria-label="Present Fullscreen"
            title="Start Fullscreen Presenter View"
            className={`px-3 py-1 text-xs font-semibold rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] ${FOCUS_RING}`}
          >
            ▶ Present Fullscreen
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            aria-label="Export Deck to PDF"
            title="Export Deck to PDF (webContents.printToPDF)"
            className={`px-3 py-1 text-xs font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] ${FOCUS_RING}`}
          >
            Export Deck to PDF
          </button>
        </div>
      </div>

      {/* Contextual Action Bar per Ribbon Tab */}
      <div className="px-3 py-2 bg-[#1E1E1E]/85 flex flex-wrap items-center gap-2 text-xs relative">
        {activeRibbonTab === 'Home' && (
          <>
            <button
              type="button"
              onClick={() => onNewSlide('title-content')}
              aria-label="New Slide"
              title="Add New Slide"
              className={`px-2.5 py-1 font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] ${FOCUS_RING}`}
            >
              + New Slide
            </button>
            <button
              type="button"
              onClick={onDuplicateSlide}
              aria-label="Duplicate Active Slide"
              title="Duplicate Active Slide"
              className={`px-2.5 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] ${FOCUS_RING}`}
            >
              Duplicate Slide
            </button>
            <button
              type="button"
              onClick={onDeleteSlide}
              aria-label="Delete Active Slide"
              title="Delete Active Slide"
              className={`px-2.5 py-1 rounded bg-[#161616] hover:bg-red-950/60 text-[#E6E6E6] border border-[#2D2D2D] ${FOCUS_RING}`}
            >
              Delete Slide
            </button>

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <button
              type="button"
              disabled={!hasSelection}
              onClick={onCopy}
              aria-label="Copy Selected Object (Ctrl+C)"
              title="Copy Selected Object (Ctrl+C)"
              className={`w-7 h-7 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center disabled:opacity-40 ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!hasClipboard}
              onClick={onPaste}
              aria-label="Paste Object (Ctrl+V)"
              title="Paste Object (Ctrl+V)"
              className={`w-7 h-7 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center disabled:opacity-40 ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
              </svg>
            </button>

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            {/* Icon-only Text Box & Shape Library Tools */}
            {renderAddTextBoxIconButton(false)}
            {renderShapeLibraryTrigger()}

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <span className="text-[#9E9E9E]">Layouts:</span>
            {(
              [
                ['title', 'Title'],
                ['title-content', 'Title + Content'],
                ['two-column', 'Two Column'],
                ['comparison', 'Comparison'],
                ['math-focus', 'Math Focus'],
                ['diagram-focus', 'Diagram Focus'],
                ['blank', 'Blank']
              ] as Array<[SlideLayoutPreset, string]>
            ).map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => onNewSlide(preset)}
                aria-label={`New ${label} Slide`}
                title={`New ${label} Slide`}
                className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] ${FOCUS_RING}`}
              >
                {label}
              </button>
            ))}
          </>
        )}

        {activeRibbonTab === 'Insert' && (
          <>
            {/* Icon-only Text Box & Full Shape Library Trigger */}
            {renderAddTextBoxIconButton(true)}
            {renderShapeLibraryTrigger()}

            {/* Icon-Only Quick Shape Palette */}
            <div
              role="group"
              aria-label="Quick Shape Insertion Tools"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161616] border border-[#2D2D2D]"
            >
              {QUICK_SHAPES.map((qs) => (
                <button
                  key={qs.kind}
                  type="button"
                  onClick={() => onInsertShape(qs.kind)}
                  aria-label={`Insert ${qs.label} Shape`}
                  title={`Insert ${qs.label} Shape`}
                  className={`w-7 h-7 p-1 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] border border-[#2D2D2D] hover:border-[#7E42C1] flex items-center justify-center transition-colors ${FOCUS_RING}`}
                >
                  <span className="w-4 h-3.5 block" aria-hidden="true">
                    <ShapeSvgRenderer kind={qs.kind} strokeWidth={4} />
                  </span>
                </button>
              ))}
            </div>

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />

            {/* Icon-only Media, LaTeX, Mermaid & Math Graph Tools */}
            <button
              type="button"
              onClick={() => onInsertElement('image')}
              aria-label="Insert Local Image into assets folder"
              title="Insert Local Image (copies into <workspace>/assets/)"
              className={`h-7 px-2 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onInsertElement('latex')}
              aria-label="Insert LaTeX Formula Block"
              title="Insert LaTeX Formula (KaTeX)"
              className={`h-7 px-2 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 4H6l6 8-6 8h12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onInsertElement('mermaid')}
              aria-label="Insert Mermaid Diagram"
              title="Insert Mermaid Diagram"
              className={`h-7 px-2 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="6" height="6" rx="1" />
                <rect x="15" y="3" width="6" height="6" rx="1" />
                <rect x="9" y="15" width="6" height="6" rx="1" />
                <path d="M6 9v3a3 3 0 003 3h6a3 3 0 003-3V9M12 12v3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onInsertElement('mathgraph')}
              aria-label="Insert Interactive Math Graph f(x)"
              title="Insert Interactive Math Graph f(x)"
              className={`h-7 px-2 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="M7 15c2.5-6 5-6 7.5 0s5 6 6.5-3" />
              </svg>
            </button>
          </>
        )}

        {activeRibbonTab === 'Arrange' && (
          <>
            <span className="text-[#9E9E9E]">Layer:</span>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => onReorderLayer('front')}
              aria-label="Bring to Front"
              title="Bring to Front"
              className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
            >
              ⇈ Front
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => onReorderLayer('forward')}
              aria-label="Bring Forward"
              title="Bring Forward"
              className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
            >
              ↑ Forward
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => onReorderLayer('backward')}
              aria-label="Send Backward"
              title="Send Backward"
              className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
            >
              ↓ Backward
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => onReorderLayer('back')}
              aria-label="Send to Back"
              title="Send to Back"
              className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
            >
              ⇊ Back
            </button>

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <span className="text-[#9E9E9E]">Align:</span>
            {(
              [
                ['left', 'Align Left'],
                ['center', 'Align Center'],
                ['right', 'Align Right'],
                ['top', 'Align Top'],
                ['middle', 'Align Middle'],
                ['bottom', 'Align Bottom']
              ] as Array<[ElementAlignment, string]>
            ).map(([align, label]) => (
              <button
                key={align}
                type="button"
                disabled={!hasSelection}
                onClick={() => onAlignSelection(align)}
                aria-label={label}
                title={label}
                className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
              >
                {label}
              </button>
            ))}

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <button
              type="button"
              disabled={selectionCount < 3}
              onClick={() => onDistributeSelection('horizontal')}
              aria-label="Distribute Horizontally"
              title="Distribute Horizontally"
              className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
            >
              Distribute H
            </button>
            <button
              type="button"
              disabled={selectionCount < 3}
              onClick={() => onDistributeSelection('vertical')}
              aria-label="Distribute Vertically"
              title="Distribute Vertically"
              className={`px-2 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
            >
              Distribute V
            </button>

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <button
              type="button"
              disabled={selectionCount < 2}
              onClick={onGroupSelection}
              aria-label="Group Selected Objects (Ctrl+G)"
              title="Group Selected Objects (Ctrl+G)"
              className={`px-2.5 py-1 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] disabled:opacity-40 ${FOCUS_RING}`}
            >
              Group (Ctrl+G)
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={onUngroupSelection}
              aria-label="Ungroup Selected Objects (Ctrl+Shift+G)"
              title="Ungroup Selected Objects (Ctrl+Shift+G)"
              className={`px-2.5 py-1 rounded bg-[#161616] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40 ${FOCUS_RING}`}
            >
              Ungroup
            </button>
          </>
        )}

        {activeRibbonTab === 'Design' && (
          <>
            <span className="text-[#9E9E9E]">Slide Background:</span>
            <button
              type="button"
              onClick={() => onBackgroundChange('#1E1E1E')}
              className={`px-2.5 py-1 rounded bg-[#1E1E1E] text-[#E6E6E6] border border-[#2D2D2D] ${FOCUS_RING}`}
            >
              Obsidian Matte (#1E1E1E)
            </button>
            <button
              type="button"
              onClick={() =>
                onBackgroundChange('linear-gradient(135deg, #1E1E1E 0%, #2A1B3D 100%)')
              }
              className={`px-2.5 py-1 rounded bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574] ${FOCUS_RING}`}
            >
              Purple Nebula Gradient
            </button>
            <button
              type="button"
              onClick={() =>
                onBackgroundChange('linear-gradient(135deg, #161616 0%, #0F3D3E 100%)')
              }
              className={`px-2.5 py-1 rounded bg-[#0F3D3E] text-[#E6E6E6] border border-[#2D2D2D] ${FOCUS_RING}`}
            >
              Midnight Teal Gradient
            </button>
            <button
              type="button"
              onClick={() => onBackgroundChange('#161616')}
              className={`px-2.5 py-1 rounded bg-[#161616] text-[#E6E6E6] border border-[#2D2D2D] ${FOCUS_RING}`}
            >
              Deep Carbon (#161616)
            </button>

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <span className="text-[#9E9E9E]">Aspect Ratio:</span>
            {(['16:9', '4:3'] as SlideAspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onAspectRatioChange(ratio)}
                className={`px-2.5 py-1 rounded border ${FOCUS_RING} ${
                  aspectRatio === ratio
                    ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                    : 'bg-[#161616] border-[#2D2D2D] text-[#9E9E9E]'
                }`}
              >
                {ratio}
              </button>
            ))}

            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <span className="text-[#9E9E9E]">Border Accent:</span>
            {['#4A2574', '#7E42C1', '#38BDF8', '#2D2D2D'].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onBorderAccentChange(hex)}
                className={`px-2 py-1 rounded font-mono text-[11px] border ${FOCUS_RING} ${
                  borderAccent === hex
                    ? 'bg-[#2A1B3D] border-[#7E42C1] text-[#E6E6E6]'
                    : 'bg-[#161616] border-[#2D2D2D] text-[#9E9E9E]'
                }`}
              >
                {hex}
              </button>
            ))}
          </>
        )}

        {activeRibbonTab === 'Transitions' && (
          <>
            <span className="text-[#9E9E9E]">Slide Transition:</span>
            {(['none', 'fade', 'slide', 'zoom'] as SlideTransitionType[]).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTransitionChange(t, transitionDurationMs)}
                  className={`px-2.5 py-1 rounded capitalize border ${FOCUS_RING} ${
                    transitionType === t
                      ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                      : 'bg-[#161616] border-[#2D2D2D] text-[#9E9E9E]'
                  }`}
                >
                  {t}
                </button>
              )
            )}
            <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />
            <span className="text-[#9E9E9E]">Duration:</span>
            {[250, 400, 650].map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => onTransitionChange(transitionType, ms)}
                className={`px-2 py-1 rounded font-mono border ${FOCUS_RING} ${
                  transitionDurationMs === ms
                    ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                    : 'bg-[#161616] border-[#2D2D2D] text-[#9E9E9E]'
                }`}
              >
                {ms}ms
              </button>
            ))}
          </>
        )}

        {activeRibbonTab === 'Review' && (
          <>
            <button
              type="button"
              onClick={onToggleSpellcheck}
              className={`px-2.5 py-1 rounded border ${FOCUS_RING} ${
                spellcheckEnabled
                  ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                  : 'bg-[#161616] border-[#2D2D2D] text-[#9E9E9E]'
              }`}
            >
              Spellcheck: {spellcheckEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={onToggleSpeakerNotes}
              className={`px-2.5 py-1 rounded border ${FOCUS_RING} ${
                speakerNotesOpen
                  ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                  : 'bg-[#161616] border-[#2D2D2D] text-[#9E9E9E]'
              }`}
            >
              Speaker Notes Drawer: {speakerNotesOpen ? 'Visible' : 'Hidden'}
            </button>
            <button
              type="button"
              onClick={onRequestAiSlideCritique}
              className={`px-2.5 py-1 font-medium rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] ${FOCUS_RING}`}
            >
              ✦ Ask Local Ollama to Critique Active Slide
            </button>
          </>
        )}
      </div>
    </div>
  );
};
