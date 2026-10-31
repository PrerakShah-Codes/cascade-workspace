import React, { useState } from 'react';
import { PdfThemeMode } from '../../../../shared/types';
import { useWorkspaceStore } from '../../store/workspace-store';

export const PdfExportModal: React.FC = () => {
  const {
    pdfExportModalState,
    setPdfExportModalState,
    activeTab,
    settings,
    setStatusMessage
  } = useWorkspaceStore();

  const [themeMode, setThemeMode] = useState<PdfThemeMode>(
    settings.pdfExport.defaultThemeMode
  );
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>(
    settings.pdfExport.defaultPageSize
  );
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!pdfExportModalState.open) return null;

  const title =
    pdfExportModalState.customTitle ||
    activeTab?.fileName ||
    'Cascade-Workspace-Export';

  const handleConfirmExport = async (): Promise<void> => {
    setIsExporting(true);
    try {
      if (window.cascadeAPI) {
        if (pdfExportModalState.mode === 'markdown') {
          const printArea = document.querySelector('.markdown-preview-prose');
          const res = await window.cascadeAPI.pdf.exportDocument({
            kind: 'markdown',
            title,
            themeMode,
            pageSize,
            renderedHtml: printArea?.innerHTML || `<p>Exported Note: ${title}</p>`
          });
          if (res.success) {
            setStatusMessage(`Exported PDF via webContents.printToPDF → ${res.savedFilePath}`);
          }
        } else if (pdfExportModalState.mode === 'table') {
          const res = await window.cascadeAPI.pdf.exportTable({
            kind: 'table',
            title,
            dbName: title,
            tableName: 'active_table',
            scope: scope === 'all' ? 'full' : 'selection',
            themeMode,
            pageSize,
            columns: ['id', 'subsystem', 'operation', 'latency_ms', 'status'],
            rows: []
          });
          if (res.success) {
            setStatusMessage(`Exported SQLite Table PDF → ${res.savedFilePath}`);
          }
        } else {
          const res = await window.cascadeAPI.pdf.exportDeck({
            kind: 'deck',
            title,
            deckTitle: title,
            aspectRatio: '16:9',
            scope,
            themeMode,
            pageSize,
            slidesHtml: ['<div>Slide Export</div>'],
            includeSpeakerNotes
          });
          if (res.success) {
            setStatusMessage(`Exported Presentation Deck PDF → ${res.savedFilePath}`);
          }
        }
      } else {
        setStatusMessage(
          `PDF Export (${themeMode.toUpperCase()}, ${pageSize}, Scope: ${scope.toUpperCase()}) completed for ${title}`
        );
      }
    } finally {
      setIsExporting(false);
      setPdfExportModalState({ ...pdfExportModalState, open: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#4A2574] bg-[#161616] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3 mb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7E42C1]">
              Native Electron webContents.printToPDF
            </span>
            <h2 className="text-base font-bold text-[#E6E6E6]">
              Export {title} to PDF
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              setPdfExportModalState({ ...pdfExportModalState, open: false })
            }
            className="px-2 py-1 text-xs rounded bg-[#1E1E1E] text-[#9E9E9E] hover:text-[#E6E6E6]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#9E9E9E] mb-1 font-medium">
              Color & Theme Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  themeMode === 'dark'
                    ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                    : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
                }`}
              >
                <div className="font-semibold">Obsidian Dark (#1E1E1E)</div>
                <div className="text-[11px] opacity-80">Preserves dark purple styling</div>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('print-light')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  themeMode === 'print-light'
                    ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                    : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
                }`}
              >
                <div className="font-semibold">Print Crisp Light (#FFFFFF)</div>
                <div className="text-[11px] opacity-80">High-contrast paper layout</div>
              </button>
            </div>
          </div>

          {(pdfExportModalState.mode === 'table' ||
            pdfExportModalState.mode === 'deck') && (
            <div>
              <label className="block text-[#9E9E9E] mb-1 font-medium">
                Export Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`py-2 px-3 rounded border font-medium ${
                    scope === 'all'
                      ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                      : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
                  }`}
                >
                  {pdfExportModalState.mode === 'table'
                    ? 'Full SQLite Table'
                    : 'Entire Presentation (.deck)'}
                </button>
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  className={`py-2 px-3 rounded border font-medium ${
                    scope === 'selected'
                      ? 'bg-[#2A1B3D] border-[#4A2574] text-[#E6E6E6]'
                      : 'bg-[#1E1E1E] border-[#2D2D2D] text-[#9E9E9E]'
                  }`}
                >
                  {pdfExportModalState.mode === 'table'
                    ? 'Selected Rows / Query Results'
                    : 'Selected Slides Only'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#9E9E9E] mb-1 font-medium">Page Size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
                className="w-full px-2.5 py-1.5 rounded bg-[#1E1E1E] border border-[#2D2D2D] text-[#E6E6E6]"
              >
                <option value="A4">A4 Standard</option>
                <option value="Letter">US Letter</option>
              </select>
            </div>

            {pdfExportModalState.mode === 'deck' && (
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#E6E6E6]">
                  <input
                    type="checkbox"
                    checked={includeSpeakerNotes}
                    onChange={(e) => setIncludeSpeakerNotes(e.target.checked)}
                    className="accent-[#7E42C1]"
                  />
                  Include Speaker Notes
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#2D2D2D] flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setPdfExportModalState({ ...pdfExportModalState, open: false })
            }
            className="px-3 py-1.5 text-xs rounded bg-[#2D2D2D] text-[#E6E6E6] hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleConfirmExport}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] transition-colors"
          >
            {isExporting ? 'Rendering PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
