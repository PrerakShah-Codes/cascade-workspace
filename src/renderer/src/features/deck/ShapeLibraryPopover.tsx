import React, { useState, useMemo } from 'react';
import { ShapeCategory, ShapeKind } from '../../../../shared/types';
import {
  SHAPE_CATALOG,
  SHAPE_CATEGORY_LABELS,
  ShapeCatalogItem
} from './shape-catalog';

export const ShapeSvgRenderer: React.FC<{
  kind?: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  className?: string;
}> = React.memo(
  ({
    kind = 'rounded',
    fill = '#2A1B3D',
    stroke = '#7E42C1',
    strokeWidth = 2,
    strokeStyle = 'solid',
    borderRadius = 14,
    className = 'w-full h-full'
  }) => {
    const dashArray =
      strokeStyle === 'dashed'
        ? '7 5'
        : strokeStyle === 'dotted'
        ? '2.5 3.5'
        : undefined;

    const sw = Math.max(1, Math.min(8, strokeWidth));
    const commonProps = {
      fill: fill === 'none' || fill === 'transparent' ? 'none' : fill,
      stroke,
      strokeWidth: sw,
      strokeDasharray: dashArray,
      strokeLinejoin: 'round' as const,
      strokeLinecap: 'round' as const
    };

    return (
      <svg
        viewBox="0 0 200 120"
        preserveAspectRatio="none"
        className={`block pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        {kind === 'rectangle' || kind === 'flow-process' ? (
          <rect x="4" y="4" width="192" height="112" rx="2" {...commonProps} />
        ) : kind === 'rounded' ? (
          <rect
            x="4"
            y="4"
            width="192"
            height="112"
            rx={Math.min(48, Math.max(6, borderRadius))}
            {...commonProps}
          />
        ) : kind === 'flow-terminator' ? (
          <rect x="4" y="6" width="192" height="108" rx="54" {...commonProps} />
        ) : kind === 'circle' || kind === 'ellipse' ? (
          <ellipse cx="100" cy="60" rx="95" ry="55" {...commonProps} />
        ) : kind === 'triangle' ? (
          <polygon points="100,5 195,114 5,114" {...commonProps} />
        ) : kind === 'right-triangle' ? (
          <polygon points="6,6 194,114 6,114" {...commonProps} />
        ) : kind === 'diamond' || kind === 'flow-decision' ? (
          <polygon points="100,4 195,60 100,116 5,60" {...commonProps} />
        ) : kind === 'pentagon' ? (
          <polygon points="100,4 194,46 158,115 42,115 6,46" {...commonProps} />
        ) : kind === 'hexagon' ? (
          <polygon points="42,5 158,5 196,60 158,115 42,115 4,60" {...commonProps} />
        ) : kind === 'octagon' ? (
          <polygon
            points="60,4 140,4 196,38 196,82 140,116 60,116 4,82 4,38"
            {...commonProps}
          />
        ) : kind === 'parallelogram' || kind === 'flow-data' ? (
          <polygon points="34,6 195,6 166,114 5,114" {...commonProps} />
        ) : kind === 'star' ? (
          <polygon
            points="100,4 123,44 192,46 138,74 157,115 100,91 43,115 62,74 8,46 77,44"
            {...commonProps}
          />
        ) : kind === 'line' || kind === 'divider' ? (
          <line
            x1="6"
            y1="60"
            x2="194"
            y2="60"
            stroke={stroke}
            strokeWidth={Math.max(2, sw + 1)}
            strokeDasharray={dashArray}
            strokeLinecap="round"
          />
        ) : kind === 'arrow-right' ? (
          <polygon
            points="5,32 138,32 138,10 195,60 138,110 138,88 5,88"
            {...commonProps}
          />
        ) : kind === 'arrow-left' ? (
          <polygon
            points="195,32 62,32 62,10 5,60 62,110 62,88 195,88"
            {...commonProps}
          />
        ) : kind === 'arrow-up' ? (
          <polygon
            points="60,115 60,44 24,44 100,5 176,44 140,44 140,115"
            {...commonProps}
          />
        ) : kind === 'arrow-down' ? (
          <polygon
            points="60,5 60,76 24,76 100,115 176,76 140,76 140,5"
            {...commonProps}
          />
        ) : kind === 'arrow-both' ? (
          <polygon
            points="5,60 48,14 48,36 152,36 152,14 195,60 152,106 152,84 48,84 48,106"
            {...commonProps}
          />
        ) : kind === 'connector-elbow' ? (
          <g>
            <path
              d="M 8 22 L 100 22 L 100 96 L 182 96"
              fill="none"
              stroke={stroke}
              strokeWidth={Math.max(2.5, sw)}
              strokeDasharray={dashArray}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polygon points="178,84 196,96 178,108" fill={stroke} />
            <circle cx="8" cy="22" r="5" fill={stroke} />
          </g>
        ) : kind === 'callout' ? (
          <path
            d="M 16 6 H 184 A 10 10 0 0 1 194 16 V 84 A 10 10 0 0 1 184 94 H 82 L 42 116 L 52 94 H 16 A 10 10 0 0 1 6 84 V 16 A 10 10 0 0 1 16 6 Z"
            {...commonProps}
          />
        ) : kind === 'callout-cloud' ? (
          <path
            d="M 48 96 H 158 C 178 96 192 82 192 66 C 192 52 180 40 164 38 C 158 18 136 8 112 12 C 94 4 68 8 56 24 C 32 22 12 38 12 58 C 12 78 28 96 48 96 Z"
            {...commonProps}
          />
        ) : kind === 'banner' ? (
          <polygon
            points="6,10 194,10 176,60 194,110 6,110 24,60"
            {...commonProps}
          />
        ) : kind === 'badge' ? (
          <path
            d="M 100 5 L 186 24 V 64 C 186 92 148 110 100 116 C 52 110 14 92 14 64 V 24 Z"
            {...commonProps}
          />
        ) : kind === 'quote-box' ? (
          <g>
            <rect
              x="4"
              y="4"
              width="192"
              height="112"
              rx="10"
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <rect x="4" y="4" width="12" height="112" rx="4" fill={stroke} />
          </g>
        ) : kind === 'flow-database' ? (
          <g>
            <path
              d="M 14 24 V 96 C 14 108 52 116 100 116 C 148 116 186 108 186 96 V 24 Z"
              {...commonProps}
            />
            <ellipse cx="100" cy="24" rx="86" ry="18" {...commonProps} />
          </g>
        ) : kind === 'flow-document' ? (
          <path
            d="M 8 8 H 192 V 96 Q 146 120 100 98 Q 54 76 8 104 Z"
            {...commonProps}
          />
        ) : kind === 'flow-predefined' ? (
          <g>
            <rect x="4" y="4" width="192" height="112" rx="4" {...commonProps} />
            <line x1="28" y1="4" x2="28" y2="116" stroke={stroke} strokeWidth={sw} />
            <line x1="172" y1="4" x2="172" y2="116" stroke={stroke} strokeWidth={sw} />
          </g>
        ) : (
          <rect x="4" y="4" width="192" height="112" rx="14" {...commonProps} />
        )}
      </svg>
    );
  }
);

ShapeSvgRenderer.displayName = 'ShapeSvgRenderer';

interface ShapeLibraryPopoverProps {
  onSelectShape: (kind: ShapeKind) => void;
  onClose?: () => void;
}

export const ShapeLibraryPopover: React.FC<ShapeLibraryPopoverProps> = ({
  onSelectShape,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ShapeCategory>('all');
  const [filterText, setFilterText] = useState<string>('');

  const categories: Array<{ id: 'all' | ShapeCategory; label: string }> = [
    { id: 'all', label: `All (${SHAPE_CATALOG.length})` },
    { id: 'geometric', label: 'Geometric' },
    { id: 'arrows', label: 'Lines & Arrows' },
    { id: 'callouts', label: 'Callouts & Badges' },
    { id: 'flowchart', label: 'Flowchart' }
  ];

  const filteredShapes = useMemo<ShapeCatalogItem[]>(() => {
    const q = filterText.trim().toLowerCase();
    return SHAPE_CATALOG.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.kind.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, filterText]);

  return (
    <div
      role="dialog"
      aria-label="Vector Shape Library"
      onClick={(e) => e.stopPropagation()}
      className="w-[440px] max-w-[92vw] rounded-xl bg-[#161616] border-2 border-[#4A2574] shadow-2xl p-3 z-50 select-none text-xs text-[#E6E6E6]"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
        <div>
          <div className="font-bold text-xs text-[#E6E6E6]">
            Vector Shape Library ({SHAPE_CATALOG.length})
          </div>
          <div className="text-[10px] text-[#9E9E9E]">
            Hover any icon for shape details • Click to insert onto slide
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Shape Library"
            title="Close Shape Library (Esc)"
            className="w-6 h-6 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E42C1]"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-2 mb-2.5">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          aria-label="Filter shapes by name"
          placeholder="Search shapes (e.g., arrow, flowchart, diamond, callout, cylinder)..."
          className="w-full px-2.5 py-1.5 rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#7E42C1] text-xs text-[#E6E6E6] focus:outline-none"
        />

        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E42C1] ${
                  active
                    ? 'bg-[#2A1B3D] border-[#7E42C1] text-[#E6E6E6]'
                    : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E] hover:text-[#E6E6E6]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon-Only Visual Shape Grid with Accessible aria-label & Tooltip */}
      <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
        {(['geometric', 'arrows', 'callouts', 'flowchart'] as ShapeCategory[]).map(
          (catKey) => {
            const groupItems = filteredShapes.filter((s) => s.category === catKey);
            if (groupItems.length === 0) return null;
            return (
              <div key={catKey}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7E42C1] mb-1.5">
                  {SHAPE_CATEGORY_LABELS[catKey]}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {groupItems.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => {
                        onSelectShape(item.kind);
                        onClose?.();
                      }}
                      aria-label={`Insert ${item.label} (${item.description})`}
                      title={`${item.label} — ${item.description}`}
                      className="group h-12 p-2 rounded-lg bg-[#1E1E1E] hover:bg-[#2A1B3D] border border-[#2D2D2D] hover:border-[#7E42C1] flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E42C1]"
                    >
                      <div className="w-10 h-7 flex items-center justify-center">
                        <ShapeSvgRenderer
                          kind={item.kind}
                          fill={item.defaultStyle.backgroundColor || '#2A1B3D'}
                          stroke={item.defaultStyle.borderColor || '#7E42C1'}
                          strokeWidth={3.5}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};
