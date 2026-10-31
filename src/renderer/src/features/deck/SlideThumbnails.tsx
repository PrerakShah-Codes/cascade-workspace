import React from 'react';
import { DeckSlide } from '../../../../shared/types';
import { ShapeSvgRenderer } from './ShapeLibraryPopover';

interface SlideThumbnailsProps {
  slides: DeckSlide[];
  activeSlideId: string;
  selectedSlideIds: Set<string>;
  onSelectSlide: (slideId: string, multiSelect?: boolean) => void;
  onMoveSlide: (index: number, direction: 'up' | 'down') => void;
  width?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

/**
 * Left Slide Navigator (`#161616`) with collapsible/resizable width, reorderable slide thumbnails,
 * mini visual element previews, and active `#4A2574` border.
 */
export const SlideThumbnails: React.FC<SlideThumbnailsProps> = React.memo(
  ({
    slides,
    activeSlideId,
    selectedSlideIds,
    onSelectSlide,
    onMoveSlide,
    width = 216,
    collapsed = false,
    onToggleCollapsed
  }) => {
    if (collapsed) {
      return (
        <aside className="w-9 shrink-0 bg-[#161616] border-r border-[#2D2D2D] flex flex-col items-center py-2.5 select-none no-print">
          <button
            type="button"
            onClick={onToggleCollapsed}
            title="Expand Slide Navigator"
            className="p-1.5 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#7E42C1] border border-[#2D2D2D] text-xs font-mono"
          >
            »
          </button>
          <div className="mt-3 space-y-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={(e) =>
                  onSelectSlide(s.id, e.ctrlKey || e.metaKey || e.shiftKey)
                }
                className={`w-6 h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center border ${
                  s.id === activeSlideId
                    ? 'bg-[#2A1B3D] border-[#7E42C1] text-[#E6E6E6]'
                    : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>
      );
    }

    return (
      <aside
        style={{ width: `${width}px` }}
        className="shrink-0 bg-[#161616] border-r border-[#2D2D2D] p-2.5 overflow-y-auto space-y-2.5 select-none no-print"
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">
            Slides ({slides.length})
          </span>
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              title="Collapse Slide Navigator"
              className="px-1.5 py-0.5 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] text-[10px] font-mono"
            >
              «
            </button>
          )}
        </div>

        {slides.map((slide, idx) => {
          const isActive = slide.id === activeSlideId;
          const isSelected = selectedSlideIds.has(slide.id);

          return (
            <div
              key={slide.id}
              onClick={(e) =>
                onSelectSlide(slide.id, e.ctrlKey || e.metaKey || e.shiftKey)
              }
              className={`group rounded-lg p-2 cursor-pointer transition-all border-2 ${
                isActive
                  ? 'bg-[#2A1B3D] border-[#4A2574] shadow-purpleGlow'
                  : isSelected
                  ? 'bg-[#2A1B3D]/50 border-[#7E42C1]'
                  : 'bg-[#1E1E1E] border-[#2D2D2D] hover:border-[#4A2574]/60'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-mono font-semibold text-[#7E42C1]">
                  #{idx + 1}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, 'up');
                    }}
                    className="px-1 rounded bg-[#161616] text-[#9E9E9E] hover:text-[#E6E6E6] disabled:opacity-30"
                    title="Move Slide Up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, 'down');
                    }}
                    className="px-1 rounded bg-[#161616] text-[#9E9E9E] hover:text-[#E6E6E6] disabled:opacity-30"
                    title="Move Slide Down"
                  >
                    ↓
                  </button>
                </div>
              </div>

              {/* Mini 16:9 Slide Preview Card with Scaled Elements */}
              <div
                className="aspect-video w-full rounded border border-[#2D2D2D] p-2 flex flex-col justify-between overflow-hidden relative"
                style={{ background: slide.background || '#1E1E1E' }}
              >
                <div className="text-[10px] font-semibold text-[#E6E6E6] line-clamp-1 leading-snug z-10">
                  {slide.title || `Slide ${idx + 1}`}
                </div>

                {/* Miniature element silhouettes */}
                <div className="relative flex-1 my-1 opacity-75 pointer-events-none">
                  {slide.elements.slice(0, 6).map((el) => (
                    <div
                      key={el.id}
                      style={{
                        left: `${Math.min(90, Math.max(0, (el.x / 960) * 100))}%`,
                        top: `${Math.min(85, Math.max(0, (el.y / 540) * 100))}%`,
                        width: `${Math.min(95, Math.max(8, (el.width / 960) * 100))}%`,
                        height: `${Math.min(85, Math.max(10, (el.height / 540) * 100))}%`
                      }}
                      className="absolute overflow-hidden"
                    >
                      {el.type === 'shape' ? (
                        <ShapeSvgRenderer
                          kind={el.style?.shapeKind || 'rounded'}
                          fill={el.style?.backgroundColor || '#2A1B3D'}
                          stroke={el.style?.borderColor || '#7E42C1'}
                          strokeWidth={4}
                        />
                      ) : (
                        <div className="w-full h-full rounded-[2px] bg-[#4A2574]/40 border border-[#7E42C1]/50" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[9px] text-[#9E9E9E] font-mono z-10">
                  <span>{slide.elements.length} obj</span>
                  <span>{slide.transition.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </aside>
    );
  }
);

SlideThumbnails.displayName = 'SlideThumbnails';
