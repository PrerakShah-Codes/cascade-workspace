import React from 'react';

export type NoteEditorMode = 'split' | 'live' | 'reading';

interface FormattingToolbarProps {
  mode: NoteEditorMode;
  onModeChange: (mode: NoteEditorMode) => void;
  onInsertSnippet: (snippet: string) => void;
  onInsertAssetImage: () => void;
  onExportPdf: () => void;
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E42C1]';

/**
 * Word-processor formatting toolbar for Markdown Notes & Documents (.md).
 * Uses accessible visual SVG icons (`aria-label`, `title` tooltip, and keyboard focus rings)
 * for all text-adding, formatting, diagram/shape, and media-embedding tools.
 */
export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  mode,
  onModeChange,
  onInsertSnippet,
  onInsertAssetImage,
  onExportPdf
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Document Formatting & Insertion Toolbar"
      className="px-3 py-1.5 bg-[#161616] border-b border-[#2D2D2D] flex flex-wrap items-center justify-between gap-2 select-none no-print"
    >
      {/* Left Visual Icon Formatting & Text Insertion Controls */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Heading 1 */}
        <button
          type="button"
          onClick={() => onInsertSnippet('\n# Heading 1\n')}
          aria-label="Insert Heading 1"
          title="Insert Heading 1 (#)"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 12h8M4 18V6M12 18V6M17 12l3-2v8" />
          </svg>
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => onInsertSnippet('\n## Heading 2\n')}
          aria-label="Insert Heading 2"
          title="Insert Heading 2 (##)"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 12h8M4 18V6M12 18V6M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
          </svg>
        </button>

        {/* Bold */}
        <button
          type="button"
          onClick={() => onInsertSnippet('**bold text**')}
          aria-label="Insert Bold Text"
          title="Bold (**text**)"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => onInsertSnippet('*italic text*')}
          aria-label="Insert Italic Text"
          title="Italic (*text*)"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => onInsertSnippet('\n- List item 1\n- List item 2\n')}
          aria-label="Insert Bullet List"
          title="Insert Bullet List"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="4" cy="12" r="1" fill="currentColor" />
            <circle cx="4" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>

        {/* Callout Block */}
        <button
          type="button"
          onClick={() =>
            onInsertSnippet('\n> **Callout:** Key engineering insight or theorem note.\n')
          }
          aria-label="Insert Callout Block"
          title="Insert Callout Quote Block"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>

        {/* Center Align Passage */}
        <button
          type="button"
          onClick={() =>
            onInsertSnippet('\n<div style="text-align: center;">Centered Passage</div>\n')
          }
          aria-label="Insert Centered Text Block"
          title="Insert Centered Text Passage"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        {/* Page Break */}
        <button
          type="button"
          onClick={() => onInsertSnippet('\n---pagebreak---\n')}
          aria-label="Insert Print Page Break"
          title="Insert Print Page Break (---pagebreak---)"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 3v6h12V3M6 21v-6h12v6" />
            <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="3 3" />
          </svg>
        </button>

        <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />

        {/* Scientific & Media Embeds (Icon-Only) */}
        <button
          type="button"
          onClick={() =>
            onInsertSnippet('\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n')
          }
          aria-label="Insert Block LaTeX Formula"
          title="Insert Block LaTeX Formula (KaTeX)"
          className={`w-7 h-7 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 4H6l6 8-6 8h12" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() =>
            onInsertSnippet(
              '\n```mermaid\nflowchart LR\n  Input[Source Data] --> Transform[SQLite Query]\n  Transform --> Output[PDF Export]\n```\n'
            )
          }
          aria-label="Insert Mermaid Diagram"
          title="Insert Mermaid Diagram"
          className={`w-7 h-7 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
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
          onClick={() =>
            onInsertSnippet(
              '\n```mathgraph\n{\n  "title": "Function Plot f(x)",\n  "xMin": -5,\n  "xMax": 5,\n  "yMin": -3,\n  "yMax": 3,\n  "showGrid": true,\n  "functions": [\n    { "id": "f1", "expression": "sin(x)", "color": "#7E42C1", "label": "sin(x)" },\n    { "id": "f2", "expression": "0.25 * x^2 - 1", "color": "#38BDF8", "label": "0.25x^2 - 1" }\n  ]\n}\n```\n'
            )
          }
          aria-label="Insert Interactive f(x) Math Graph"
          title="Insert Interactive f(x) Math Graph"
          className={`w-7 h-7 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 3v18h18" />
            <path d="M7 15c2.5-6 5-6 7.5 0s5 6 6.5-3" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onInsertAssetImage}
          aria-label="Copy Image to workspace assets and embed"
          title="Copy Image to <workspace>/assets/ and Embed"
          className={`w-7 h-7 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] flex items-center justify-center ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
      </div>

      {/* Right Mode Switcher & One-Click PDF Export */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg bg-[#1E1E1E] p-0.5 border border-[#2D2D2D]">
          {(['split', 'live', 'reading'] as NoteEditorMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              aria-label={`Switch to ${m} view mode`}
              title={`Switch to ${m} view mode`}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${FOCUS_RING} ${
                mode === m
                  ? 'bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]'
                  : 'text-[#9E9E9E] hover:text-[#E6E6E6]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onExportPdf}
          aria-label="Export Note to PDF"
          title="One-Click Export Note to PDF"
          className={`px-3 py-1 text-xs font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] transition-colors ${FOCUS_RING}`}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
};
