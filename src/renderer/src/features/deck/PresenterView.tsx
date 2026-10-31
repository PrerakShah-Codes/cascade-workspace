import React, { useState, useEffect } from 'react';
import { DeckDocument } from '../../../../shared/types';
import { SlideCanvas } from './SlideCanvas';

interface PresenterViewProps {
  deck: DeckDocument;
  initialSlideIndex: number;
  onExit: () => void;
}

/**
 * Fullscreen Slideshow Presenter Mode for `.deck` presentations.
 */
export const PresenterView: React.FC<PresenterViewProps> = ({
  deck,
  initialSlideIndex,
  onExit
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialSlideIndex);
  const slide = deck.slides[currentIndex] || deck.slides[0];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentIndex((i) => Math.min(deck.slides.length - 1, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [deck.slides.length, onExit]);

  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#161616] flex flex-col">
      {/* Top Presenter Bar */}
      <div className="px-5 py-2.5 bg-[#161616] border-b border-[#2D2D2D] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574] font-semibold">
            PRESENTER VIEW
          </span>
          <span className="font-bold text-[#E6E6E6]">{deck.title}</span>
          <span className="text-[#9E9E9E]">
            Slide {currentIndex + 1} of {deck.slides.length} • Transition:{' '}
            {slide.transition.type} ({slide.transition.durationMs}ms)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="px-3 py-1 rounded bg-[#1E1E1E] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            type="button"
            disabled={currentIndex === deck.slides.length - 1}
            onClick={() =>
              setCurrentIndex((i) => Math.min(deck.slides.length - 1, i + 1))
            }
            className="px-3 py-1 rounded bg-[#1E1E1E] text-[#E6E6E6] border border-[#2D2D2D] disabled:opacity-40"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1 font-semibold rounded bg-[#4A2574] text-[#E6E6E6]"
          >
            Exit Presenter (Esc)
          </button>
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="flex-1 flex min-h-0">
        <SlideCanvas
          slide={slide}
          aspectRatio={deck.theme.aspectRatio}
          selectedElementId={null}
          onSelectElement={() => {}}
          onUpdateElement={() => {}}
          onDeleteElement={() => {}}
          spellcheckEnabled={false}
          readOnly
        />

        {/* Speaker Notes Sidebar */}
        <div className="w-80 bg-[#161616] border-l border-[#2D2D2D] p-4 flex flex-col">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7E42C1] mb-2">
            Speaker Notes
          </div>
          <div className="flex-1 p-3 rounded-lg bg-[#1E1E1E] border border-[#2D2D2D] text-xs text-[#E6E6E6] leading-relaxed whitespace-pre-wrap">
            {slide.speakerNotes || 'No speaker notes for this slide.'}
          </div>
        </div>
      </div>
    </div>
  );
};
