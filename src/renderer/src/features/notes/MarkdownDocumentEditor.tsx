import React, { useState, useEffect, useMemo } from 'react';
import { MathGraphConfig } from '../../../../shared/types';
import { useWorkspaceStore } from '../../store/workspace-store';
import { KaTeXRenderer, formatSymbolicMathHtml } from '../../components/common/KaTeXRenderer';
import { MermaidRenderer } from '../../components/common/MermaidRenderer';
import { MathGraphWidget } from '../../components/common/MathGraphWidget';
import { FormattingToolbar, NoteEditorMode } from './FormattingToolbar';

interface MarkdownDocumentEditorProps {
  relativePath: string;
}

type ParsedBlock =
  | { kind: 'markdown'; text: string }
  | { kind: 'latex-block'; latex: string }
  | { kind: 'mermaid'; code: string }
  | { kind: 'mathgraph'; config: MathGraphConfig; rawIndex: number }
  | { kind: 'pagebreak' };

/**
 * Rich Markdown Note & Document Editor (`.md`) in `#1E1E1E`.
 * Combines split-pane, live-preview, and reading modes with built-in KaTeX math,
 * Mermaid diagrams, interactive `mathgraph` coordinate plots, and one-click PDF export.
 */
export const MarkdownDocumentEditor: React.FC<MarkdownDocumentEditorProps> = ({
  relativePath
}) => {
  const {
    readFileContent,
    saveFileContent,
    copyExternalAssetToWorkspace,
    setPdfExportModalState,
    settings
  } = useWorkspaceStore();

  const [content, setContent] = useState<string>('');
  const [mode, setMode] = useState<NoteEditorMode>(
    settings.editor.defaultNoteViewMode
  );

  useEffect(() => {
    let active = true;
    readFileContent(relativePath).then((raw) => {
      if (active) setContent(raw);
    });
    return () => {
      active = false;
    };
  }, [relativePath, readFileContent]);

  const handleContentUpdate = (nextContent: string): void => {
    setContent(nextContent);
    saveFileContent(relativePath, nextContent);
  };

  const handleInsertSnippet = (snippet: string): void => {
    handleContentUpdate(`${content}${snippet}`);
  };

  const handleInsertAssetImage = async (): Promise<void> => {
    const assetRelPath = await copyExternalAssetToWorkspace();
    handleInsertSnippet(`\n![Embedded Workspace Asset](${assetRelPath})\n`);
  };

  const blocks = useMemo<ParsedBlock[]>(() => {
    const result: ParsedBlock[] = [];
    const lines = content.split(/\r?\n/);
    let buffer: string[] = [];
    let i = 0;

    const flushMarkdown = (): void => {
      if (buffer.length > 0) {
        result.push({ kind: 'markdown', text: buffer.join('\n') });
        buffer = [];
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim() === '---pagebreak---') {
        flushMarkdown();
        result.push({ kind: 'pagebreak' });
        i++;
        continue;
      }

      if (line.trim().startsWith('```mermaid')) {
        flushMarkdown();
        i++;
        const codeLines: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing fence
        result.push({ kind: 'mermaid', code: codeLines.join('\n') });
        continue;
      }

      if (line.trim().startsWith('```mathgraph')) {
        flushMarkdown();
        i++;
        const jsonLines: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          jsonLines.push(lines[i]);
          i++;
        }
        i++; // skip closing fence
        let parsedConfig: MathGraphConfig = {
          title: 'Function Graph f(x)',
          xMin: -5,
          xMax: 5,
          yMin: -3,
          yMax: 3,
          showGrid: true,
          functions: [{ id: 'f1', expression: 'sin(x)', color: '#7E42C1', label: 'sin(x)' }]
        };
        try {
          parsedConfig = JSON.parse(jsonLines.join('\n'));
        } catch {
          // Keep default config if user is mid-typing JSON
        }
        result.push({
          kind: 'mathgraph',
          config: parsedConfig,
          rawIndex: result.length
        });
        continue;
      }

      if (line.trim().startsWith('$$')) {
        flushMarkdown();
        if (line.trim().endsWith('$$') && line.trim().length > 4) {
          result.push({
            kind: 'latex-block',
            latex: line.trim().slice(2, -2).trim()
          });
          i++;
          continue;
        }
        i++;
        const mathLines: string[] = [];
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          const last = lines[i].trim().replace(/\$\$$/, '');
          if (last) mathLines.push(last);
          i++;
        }
        result.push({ kind: 'latex-block', latex: mathLines.join('\n').trim() });
        continue;
      }

      buffer.push(line);
      i++;
    }

    flushMarkdown();
    return result;
  }, [content]);

  const renderMarkdownSegmentHtml = (md: string): string => {
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Blockquotes / Callouts
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Images referencing `<workspace>/assets/`
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<div class="my-2 p-2.5 rounded-lg bg-[#161616] border border-[#2D2D2D] inline-flex items-center gap-2 text-xs text-[#E6E6E6]"><span class="px-1.5 py-0.5 rounded bg-[#2A1B3D] text-[#7E42C1] font-mono">ASSET</span><span>$1</span><code class="text-[#9E9E9E]">$2</code></div>'
    );

    // Inline KaTeX math $...$
    html = html.replace(/\$([^$\n]+)\$/g, (_m, expr) => {
      return `<span class="inline-block px-1.5 py-0.2 rounded bg-[#2A1B3D]/70 border border-[#4A2574]/50 font-serif">${formatSymbolicMathHtml(
        expr
      )}</span>`;
    });

    // Bold, Italic, Inline Code
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bullet lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

    // Paragraphs
    html = html
      .split(/\n{2,}/)
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed) return '';
        if (
          trimmed.startsWith('<h1>') ||
          trimmed.startsWith('<h2>') ||
          trimmed.startsWith('<h3>') ||
          trimmed.startsWith('<blockquote>') ||
          trimmed.startsWith('<li')
        ) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('\n');

    return html;
  };

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E]">
      <FormattingToolbar
        mode={mode}
        onModeChange={setMode}
        onInsertSnippet={handleInsertSnippet}
        onInsertAssetImage={handleInsertAssetImage}
        onExportPdf={() =>
          setPdfExportModalState({
            open: true,
            mode: 'markdown',
            customTitle: relativePath.split('/').pop()
          })
        }
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Source Markdown Pane (shown in split or live mode) */}
        {(mode === 'split' || mode === 'live') && (
          <div
            className={`${
              mode === 'split' ? 'w-1/2 border-r border-[#2D2D2D]' : 'w-5/12 border-r border-[#2D2D2D]'
            } h-full flex flex-col bg-[#1E1E1E] no-print`}
          >
            <div className="px-3 py-1 bg-[#161616] border-b border-[#2D2D2D] flex items-center justify-between text-[11px] text-[#9E9E9E]">
              <span>MARKDOWN SOURCE ({relativePath})</span>
              <span>{content.length} chars</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentUpdate(e.target.value)}
              spellCheck={settings.editor.spellcheck}
              style={{
                fontSize: `${settings.editor.fontSizePx}px`,
                lineHeight: settings.editor.lineHeight
              }}
              className="flex-1 w-full p-4 bg-[#1E1E1E] text-[#E6E6E6] font-mono resize-none focus:outline-none"
              placeholder="Write Markdown, $LaTeX$, ```mermaid, or ```mathgraph blocks..."
            />
          </div>
        )}

        {/* Live Rendered Document Preview Pane */}
        <div
          className={`${
            mode === 'reading' ? 'w-full max-w-4xl mx-auto' : 'flex-1'
          } h-full overflow-y-auto p-6 bg-[#1E1E1E]`}
        >
          <article className="markdown-preview-prose max-w-none">
            {blocks.map((block, idx) => {
              if (block.kind === 'pagebreak') {
                return <div key={`pb-${idx}`} className="markdown-page-break" />;
              }
              if (block.kind === 'latex-block') {
                return <KaTeXRenderer key={`katex-${idx}`} latex={block.latex} block />;
              }
              if (block.kind === 'mermaid') {
                return <MermaidRenderer key={`merm-${idx}`} code={block.code} />;
              }
              if (block.kind === 'mathgraph') {
                return <MathGraphWidget key={`mg-${idx}`} config={block.config} />;
              }
              return (
                <div
                  key={`md-${idx}`}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownSegmentHtml(block.text)
                  }}
                />
              );
            })}
          </article>
        </div>
      </div>
    </div>
  );
};
