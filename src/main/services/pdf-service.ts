import * as fs from 'fs/promises';
import * as path from 'path';
import {
  PdfDeckExportPayload,
  PdfDocumentExportPayload,
  PdfExportResult,
  PdfTableExportPayload
} from '../../shared/types';

/**
 * Native Electron PDF Export Pipeline (`webContents.printToPDF`).
 * Renders notes/documents, SQLite tables (full or selected rows), and `.deck` presentations
 * (full deck or selected slides) in an offscreen BrowserWindow while preserving KaTeX math,
 * Mermaid diagrams, mathematical function SVG graphs, and dark/print layouts.
 */
export class PdfService {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  public setWorkspaceRoot(root: string): void {
    this.workspaceRoot = root;
  }

  /**
   * Builds a complete self-contained HTML document for `webContents.printToPDF`
   * with locked-in theme variables (`#1E1E1E` dark or `#FFFFFF` print-light).
   */
  public buildPrintHtml(
    payload: PdfDocumentExportPayload | PdfTableExportPayload | PdfDeckExportPayload
  ): string {
    const isDark = payload.themeMode === 'dark';
    const bgPrimary = isDark ? '#1E1E1E' : '#FFFFFF';
    const bgSurface = isDark ? '#161616' : '#F6F5F8';
    const bgSecondary = isDark ? '#2A1B3D' : '#F1EBF8';
    const textPrimary = isDark ? '#E6E6E6' : '#18181B';
    const textMuted = isDark ? '#9E9E9E' : '#52525B';
    const borderNeutral = isDark ? '#2D2D2D' : '#D4D4D8';
    const accentPurple = '#7E42C1';
    const borderPurple = '#4A2574';

    let bodyMarkup = '';

    if (payload.kind === 'markdown') {
      bodyMarkup = `
        <header class="print-doc-header">
          <div class="doc-badge">CASCADE WORKSPACE NOTE</div>
          <h1>${this.escapeHtml(payload.title)}</h1>
        </header>
        <main class="markdown-print-body">
          ${payload.renderedHtml}
        </main>
      `;
    } else if (payload.kind === 'table') {
      const headers = payload.columns
        .map((col) => `<th>${this.escapeHtml(col)}</th>`)
        .join('');
      const rowsHtml = payload.rows
        .map((row) => {
          const cells = payload.columns
            .map((col) => {
              const val = row[col];
              if (val === null || val === undefined) {
                return `<td class="null-cell">NULL</td>`;
              }
              return `<td>${this.escapeHtml(String(val))}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      bodyMarkup = `
        <header class="print-doc-header">
          <div class="doc-badge">SQLITE DATABASE EXPORT • ${payload.scope.toUpperCase()}</div>
          <h1>${this.escapeHtml(payload.dbName)} — ${this.escapeHtml(payload.tableName)}</h1>
          <p class="meta-line">Rows exported: ${payload.rows.length} ${
            payload.sqlQueryUsed ? `• Query: <code>${this.escapeHtml(payload.sqlQueryUsed)}</code>` : ''
          }</p>
        </header>
        <table class="sqlite-print-table">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    } else if (payload.kind === 'deck') {
      const slidePages = payload.slidesHtml
        .map(
          (slideMarkup, idx) => `
          <section class="deck-slide-page">
            <div class="slide-frame" data-aspect="${payload.aspectRatio}">
              ${slideMarkup}
            </div>
            <div class="slide-footer">
              <span>${this.escapeHtml(payload.deckTitle)}</span>
              <span>Slide ${idx + 1} of ${payload.slidesHtml.length}</span>
            </div>
          </section>
        `
        )
        .join('');

      bodyMarkup = `<div class="deck-print-container">${slidePages}</div>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escapeHtml(payload.title)}</title>
  <style>
    :root {
      --bg-primary: ${bgPrimary};
      --bg-chrome: ${bgSurface};
      --bg-secondary: ${bgSecondary};
      --text-primary: ${textPrimary};
      --text-muted: ${textMuted};
      --border-neutral: ${borderNeutral};
      --accent-purple: ${accentPurple};
      --border-purple: ${borderPurple};
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }
    body { padding: ${payload.kind === 'deck' ? '12mm' : '16mm'}; }
    .print-doc-header {
      border-bottom: 2px solid var(--border-purple);
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .doc-badge {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--accent-purple);
      margin-bottom: 4px;
    }
    .print-doc-header h1 {
      margin: 0;
      font-size: 20pt;
      color: var(--text-primary);
    }
    .meta-line {
      margin: 6px 0 0 0;
      font-size: 9.5pt;
      color: var(--text-muted);
    }
    .sqlite-print-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .sqlite-print-table th {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-purple);
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
    }
    .sqlite-print-table td {
      border: 1px solid var(--border-neutral);
      padding: 6px 10px;
      color: var(--text-primary);
    }
    .sqlite-print-table td.null-cell {
      color: var(--text-muted);
      font-style: italic;
    }
    .deck-slide-page {
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-bottom: 16px;
    }
    .deck-slide-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .slide-frame {
      width: 100%;
      aspect-ratio: 16 / 9;
      border: 2px solid var(--border-purple);
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      background: var(--bg-primary);
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: var(--text-muted);
      margin-top: 8px;
    }
    svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${bodyMarkup}
</body>
</html>`;
  }

  /**
   * Renders the HTML inside an offscreen Electron BrowserWindow and calls `webContents.printToPDF`.
   */
  public async exportToPdf(
    payload: PdfDocumentExportPayload | PdfTableExportPayload | PdfDeckExportPayload,
    explicitTargetFilePath?: string
  ): Promise<PdfExportResult> {
    const htmlContent = this.buildPrintHtml(payload);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const electron = require('electron');
      const { BrowserWindow, dialog } = electron;

      let targetPath = explicitTargetFilePath;
      if (!targetPath) {
        const sanitizedTitle = payload.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'cascade-export';
        const defaultPath = path.join(this.workspaceRoot, `${sanitizedTitle}.pdf`);
        const saveRes = await dialog.showSaveDialog({
          title: `Export ${payload.title} to PDF`,
          defaultPath,
          filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
        });

        if (saveRes.canceled || !saveRes.filePath) {
          return { success: false, canceled: true };
        }
        targetPath = String(saveRes.filePath);
      }
      const resolvedTargetPath: string = targetPath;

      const printWin = new BrowserWindow({
        show: false,
        width: 1280,
        height: 900,
        webPreferences: {
          offscreen: true,
          contextIsolation: true,
          sandbox: true
        }
      });

      try {
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        await printWin.loadURL(dataUrl);

        const pdfBuffer = await printWin.webContents.printToPDF({
          printBackground: true,
          pageSize: payload.pageSize || 'A4',
          landscape: payload.kind === 'deck' ? true : Boolean(payload.landscape),
          margins: {
            top: 0.4,
            bottom: 0.4,
            left: 0.4,
            right: 0.4
          }
        });

        await fs.writeFile(resolvedTargetPath, pdfBuffer);
        return {
          success: true,
          savedFilePath: resolvedTargetPath
        };
      } finally {
        printWin.destroy();
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }

  private escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
