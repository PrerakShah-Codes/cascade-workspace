import React from 'react';
import { useWorkspaceStore } from '../../store/workspace-store';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E42C1]';

/**
 * Left Activity Ribbon (`#161616`):
 * Compact vertical icon bar for toggling File Explorer, Global Search,
 * AI Assistant Panel, and opening the Categorized Settings Modal.
 */
export const ActivityRibbon: React.FC = () => {
  const {
    leftSidebarOpen,
    leftSidebarView,
    setLeftSidebarOpen,
    setLeftSidebarView,
    rightAiPanelOpen,
    setRightAiPanelOpen,
    setSettingsModalOpen,
    setPdfExportModalState,
    activeTab
  } = useWorkspaceStore();

  const handleToggleLeftView = (view: 'explorer' | 'search'): void => {
    if (leftSidebarOpen && leftSidebarView === view) {
      setLeftSidebarOpen(false);
    } else {
      setLeftSidebarView(view);
      setLeftSidebarOpen(true);
    }
  };

  return (
    <aside
      className="w-12 shrink-0 bg-[#161616] border-r border-[#2D2D2D] flex flex-col items-center justify-between py-3 select-none no-print"
      aria-label="Activity Ribbon"
    >
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Brand Badge */}
        <div
          className="w-8 h-8 rounded-lg bg-[#2A1B3D] border border-[#4A2574] flex items-center justify-center text-xs font-bold text-[#7E42C1] mb-2"
          title="Cascade Workspace (Local-First)"
          aria-label="Cascade Workspace"
        >
          CW
        </div>

        {/* File Explorer Toggle */}
        <button
          type="button"
          onClick={() => handleToggleLeftView('explorer')}
          aria-label="Toggle File Explorer (Ctrl+Shift+E)"
          title="File Explorer (Ctrl+Shift+E)"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${FOCUS_RING} ${
            leftSidebarOpen && leftSidebarView === 'explorer'
              ? 'bg-[#2A1B3D] text-[#E6E6E6]'
              : 'text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E]'
          }`}
        >
          {leftSidebarOpen && leftSidebarView === 'explorer' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#7E42C1]" />
          )}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>

        {/* Global Workspace Search Toggle */}
        <button
          type="button"
          onClick={() => handleToggleLeftView('search')}
          aria-label="Toggle Global Workspace Search (Ctrl+Shift+F)"
          title="Global Workspace Search (Ctrl+Shift+F)"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${FOCUS_RING} ${
            leftSidebarOpen && leftSidebarView === 'search'
              ? 'bg-[#2A1B3D] text-[#E6E6E6]'
              : 'text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E]'
          }`}
        >
          {leftSidebarOpen && leftSidebarView === 'search' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#7E42C1]" />
          )}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        {/* Right Ollama AI Assistant Panel Toggle */}
        <button
          type="button"
          onClick={() => setRightAiPanelOpen(!rightAiPanelOpen)}
          aria-label="Toggle Local Ollama AI Assistant"
          title="Toggle Local Ollama AI Assistant"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${FOCUS_RING} ${
            rightAiPanelOpen
              ? 'bg-[#2A1B3D] text-[#E6E6E6]'
              : 'text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E]'
          }`}
        >
          {rightAiPanelOpen && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#7E42C1]" />
          )}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3v-6a3 3 0 013-3h1V6a4 4 0 014-4z" />
            <circle cx="9" cy="13" r="1" />
            <circle cx="15" cy="13" r="1" />
          </svg>
        </button>

        {/* Quick Native PDF Export Trigger */}
        <button
          type="button"
          onClick={() =>
            setPdfExportModalState({
              open: true,
              mode:
                activeTab?.extension === 'deck'
                  ? 'deck'
                  : activeTab?.extension === 'db' || activeTab?.extension === 'sqlite'
                  ? 'table'
                  : 'markdown',
              customTitle: activeTab?.fileName
            })
          }
          aria-label="Export Active View to PDF"
          title="Export Active View to PDF (webContents.printToPDF)"
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E] transition-colors ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" />
          </svg>
        </button>
      </div>

      {/* Bottom Categorized Settings Modal Button */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          aria-label="Open Categorized Settings (Ctrl+,)"
          title="Categorized Settings (Ctrl+,)"
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#2A1B3D] transition-colors ${FOCUS_RING}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
