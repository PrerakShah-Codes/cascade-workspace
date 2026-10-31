import React from 'react';
import { ShapeKind, SlideElement, SlideElementStyle } from '../../../../shared/types';
import { SHAPE_CATALOG } from './shape-catalog';
import { ElementAlignment } from './deck-commands';

interface ElementInspectorBarProps {
  selectedElements: SlideElement[];
  spellcheckEnabled: boolean;
  onUpdateSelected: (updater: (el: SlideElement) => SlideElement) => void;
  onAlignSelected: (alignment: ElementAlignment) => void;
  onDistributeSelected: (axis: 'horizontal' | 'vertical') => void;
  onReorderLayer: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
}

const FILL_SWATCHES = [
  { label: 'Obsidian Purple', value: '#2A1B3D' },
  { label: 'Royal Violet', value: '#4A2574' },
  { label: 'Deep Carbon', value: '#161616' },
  { label: 'Matte Slate', value: '#1E1E1E' },
  { label: 'Cyber Teal', value: '#0F3D3E' },
  { label: 'Crimson Dark', value: '#3B1D2E' },
  { label: 'Transparent', value: 'transparent' }
];

const STROKE_SWATCHES = [
  '#7E42C1',
  '#4A2574',
  '#38BDF8',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#E6E6E6'
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E42C1]';

/**
 * Contextual Formatting, Styling, Alignment, Grouping & Layer Inspector Bar
 * with accessible icon-only controls (`aria-label`, `title`, and keyboard focus rings).
 */
export const ElementInspectorBar: React.FC<ElementInspectorBarProps> = ({
  selectedElements,
  spellcheckEnabled,
  onUpdateSelected,
  onAlignSelected,
  onDistributeSelected,
  onReorderLayer,
  onGroupSelected,
  onUngroupSelected,
  onDuplicateSelected,
  onDeleteSelected
}) => {
  if (selectedElements.length === 0) return null;

  const primary = selectedElements[0];
  const isMulti = selectedElements.length > 1;
  const hasGroup = selectedElements.some((el) => Boolean(el.groupId));
  const style: SlideElementStyle = primary.style || {};

  const updateStyle = (patch: Partial<SlideElementStyle>): void => {
    onUpdateSelected((el) => ({
      ...el,
      style: {
        ...(el.style || {}),
        ...patch
      }
    }));
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-full bg-[#161616] border-b border-[#4A2574]/80 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs select-none z-20 no-print"
    >
      <span className="px-2 py-0.5 rounded bg-[#2A1B3D] border border-[#4A2574] text-[#7E42C1] font-mono text-[10px] font-bold uppercase">
        {isMulti
          ? `${selectedElements.length} Selected${hasGroup ? ' (Grouped)' : ''}`
          : primary.type === 'shape'
          ? `Shape: ${style.shapeKind || 'rounded'}`
          : primary.type}
      </span>

      {!isMulti && (
        <input
          type="text"
          value={primary.content}
          spellCheck={spellcheckEnabled}
          aria-label="Selected element text content"
          onChange={(e) => {
            const val = e.target.value;
            onUpdateSelected((el) => ({ ...el, content: val }));
          }}
          placeholder={
            primary.type === 'shape'
              ? 'Shape text label (or double-click shape)...'
              : 'Element content...'
          }
          className="w-56 px-2 py-1 rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#7E42C1] text-[#E6E6E6] font-mono text-xs focus:outline-none"
        />
      )}

      {primary.type === 'shape' && (
        <select
          value={style.shapeKind || 'rounded'}
          onChange={(e) => updateStyle({ shapeKind: e.target.value as ShapeKind })}
          aria-label="Switch Shape Geometry"
          title="Switch Shape Type"
          className={`px-2 py-1 rounded bg-[#1E1E1E] border border-[#4A2574] text-[#E6E6E6] text-xs ${FOCUS_RING}`}
        >
          {SHAPE_CATALOG.map((s) => (
            <option key={s.kind} value={s.kind}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      {(primary.type === 'shape' || primary.type === 'text' || primary.type === 'latex') && (
        <div className="flex items-center gap-1.5 border-l border-[#2D2D2D] pl-2">
          <span className="text-[10px] text-[#9E9E9E]">Fill:</span>
          <div className="flex items-center gap-1">
            {FILL_SWATCHES.map((sw) => (
              <button
                key={sw.value}
                type="button"
                onClick={() => updateStyle({ backgroundColor: sw.value })}
                aria-label={`Set Fill Color ${sw.label}`}
                title={`Fill: ${sw.label}`}
                style={{
                  backgroundColor: sw.value === 'transparent' ? '#1E1E1E' : sw.value
                }}
                className={`w-4 h-4 rounded-sm border ${FOCUS_RING} ${
                  style.backgroundColor === sw.value
                    ? 'border-white scale-110'
                    : 'border-[#4A2574]'
                }`}
              />
            ))}
          </div>

          <span className="text-[10px] text-[#9E9E9E] ml-1">Stroke:</span>
          <div className="flex items-center gap-1">
            {STROKE_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => updateStyle({ borderColor: hex })}
                aria-label={`Set Stroke Color ${hex}`}
                title={`Stroke: ${hex}`}
                style={{ backgroundColor: hex }}
                className={`w-3.5 h-3.5 rounded-full border ${FOCUS_RING} ${
                  style.borderColor === hex ? 'border-white scale-110' : 'border-black/40'
                }`}
              />
            ))}
          </div>

          <select
            value={style.borderWidth ?? 2}
            onChange={(e) => updateStyle({ borderWidth: Number(e.target.value) })}
            aria-label="Stroke Width"
            title="Stroke Width"
            className={`px-1.5 py-0.5 rounded bg-[#1E1E1E] border border-[#2D2D2D] text-[#E6E6E6] text-[11px] ${FOCUS_RING}`}
          >
            {[1, 2, 3, 4, 6].map((w) => (
              <option key={w} value={w}>
                {w}px
              </option>
            ))}
          </select>

          <select
            value={style.strokeStyle || 'solid'}
            onChange={(e) =>
              updateStyle({
                strokeStyle: e.target.value as 'solid' | 'dashed' | 'dotted'
              })
            }
            aria-label="Stroke Dash Style"
            title="Stroke Dash Style"
            className={`px-1.5 py-0.5 rounded bg-[#1E1E1E] border border-[#2D2D2D] text-[#E6E6E6] text-[11px] ${FOCUS_RING}`}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
      )}

      {/* Visual Icon Typography Controls (Text & Shapes) */}
      {(primary.type === 'text' || primary.type === 'shape') && (
        <div className="flex items-center gap-1 border-l border-[#2D2D2D] pl-2">
          <select
            value={style.fontSize || (primary.type === 'shape' ? 17 : 24)}
            onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
            aria-label="Font Size"
            title="Font Size"
            className={`px-1.5 py-0.5 rounded bg-[#1E1E1E] border border-[#2D2D2D] text-[#E6E6E6] text-[11px] ${FOCUS_RING}`}
          >
            {[12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56].map((sz) => (
              <option key={sz} value={sz}>
                {sz}pt
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              updateStyle({
                fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold'
              })
            }
            aria-label="Toggle Bold Text"
            title="Bold"
            className={`w-6 h-6 rounded flex items-center justify-center border ${FOCUS_RING} ${
              style.fontWeight === 'bold'
                ? 'bg-[#2A1B3D] border-[#7E42C1] text-[#E6E6E6]'
                : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() =>
              updateStyle({
                fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic'
              })
            }
            aria-label="Toggle Italic Text"
            title="Italic"
            className={`w-6 h-6 rounded flex items-center justify-center border ${FOCUS_RING} ${
              style.fontStyle === 'italic'
                ? 'bg-[#2A1B3D] border-[#7E42C1] text-[#E6E6E6]'
                : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="19" y1="4" x2="10" y2="4" />
              <line x1="14" y1="20" x2="5" y2="20" />
              <line x1="15" y1="4" x2="9" y2="20" />
            </svg>
          </button>

          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => updateStyle({ textAlign: align })}
              aria-label={`Align Text ${align}`}
              title={`Align Text ${align}`}
              className={`w-6 h-6 rounded flex items-center justify-center border ${FOCUS_RING} ${
                (style.textAlign || 'center') === align
                  ? 'bg-[#2A1B3D] border-[#7E42C1] text-[#E6E6E6]'
                  : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line
                  x1={align === 'right' ? '9' : align === 'center' ? '6' : '3'}
                  y1="12"
                  x2={align === 'left' ? '15' : align === 'center' ? '18' : '21'}
                  y2="12"
                />
                <line
                  x1={align === 'right' ? '6' : align === 'center' ? '5' : '3'}
                  y1="18"
                  x2={align === 'left' ? '18' : align === 'center' ? '19' : '21'}
                  y2="18"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Icon Alignment & Distribution Controls */}
      <div className="flex items-center gap-1 border-l border-[#2D2D2D] pl-2">
        {(
          [
            ['left', '⫷', 'Align Left'],
            ['center', '⫿', 'Align Horizontal Center'],
            ['right', '⫸', 'Align Right'],
            ['top', '⊤', 'Align Top'],
            ['middle', '┼', 'Align Vertical Middle'],
            ['bottom', '⊥', 'Align Bottom']
          ] as Array<[ElementAlignment, string, string]>
        ).map(([alignment, icon, label]) => (
          <button
            key={alignment}
            type="button"
            onClick={() => onAlignSelected(alignment)}
            aria-label={label}
            title={label}
            className={`w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] hover:border-[#4A2574] flex items-center justify-center text-[11px] ${FOCUS_RING}`}
          >
            {icon}
          </button>
        ))}

        {selectedElements.length >= 3 && (
          <>
            <button
              type="button"
              onClick={() => onDistributeSelected('horizontal')}
              aria-label="Distribute Horizontally"
              title="Distribute Horizontally"
              className={`w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#7E42C1] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="4" y1="4" x2="4" y2="20" />
                <line x1="20" y1="4" x2="20" y2="20" />
                <rect x="9" y="7" width="6" height="10" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onDistributeSelected('vertical')}
              aria-label="Distribute Vertically"
              title="Distribute Vertically"
              className={`w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#7E42C1] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="4" y1="4" x2="20" y2="4" />
                <line x1="4" y1="20" x2="20" y2="20" />
                <rect x="7" y="9" width="10" height="6" rx="1" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Z-Order Layer Arrangement & Grouping Icon Buttons */}
      <div className="flex items-center gap-1 border-l border-[#2D2D2D] pl-2">
        <button
          type="button"
          onClick={() => onReorderLayer('front')}
          aria-label="Bring to Front"
          title="Bring to Front"
          className={`w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center text-[11px] ${FOCUS_RING}`}
        >
          ⇈
        </button>
        <button
          type="button"
          onClick={() => onReorderLayer('back')}
          aria-label="Send to Back"
          title="Send to Back"
          className={`w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center text-[11px] ${FOCUS_RING}`}
        >
          ⇊
        </button>

        {isMulti && (
          <button
            type="button"
            onClick={onGroupSelected}
            aria-label="Group Selected Elements (Ctrl+G)"
            title="Group Selected Elements (Ctrl+G)"
            className={`w-6 h-6 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <path d="M10 6h8v8M6 10v8h8" />
            </svg>
          </button>
        )}
        {hasGroup && (
          <button
            type="button"
            onClick={onUngroupSelected}
            aria-label="Ungroup Elements (Ctrl+Shift+G)"
            title="Ungroup Elements (Ctrl+Shift+G)"
            className={`w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <line x1="4" y1="20" x2="20" y2="4" />
            </svg>
          </button>
        )}
      </div>

      {/* Duplicate & Delete Icon Buttons */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          type="button"
          onClick={onDuplicateSelected}
          aria-label="Duplicate Selected (Ctrl+D)"
          title="Duplicate Selected (Ctrl+D)"
          className={`w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          aria-label="Delete Selected (Delete / Backspace)"
          title="Delete Selected (Delete / Backspace)"
          className={`w-6 h-6 rounded bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800 flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};
