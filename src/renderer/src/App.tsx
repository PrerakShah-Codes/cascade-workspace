import React from 'react';
import { WorkspaceProvider, useWorkspaceStore } from './store/workspace-store';
import { ActivityRibbon } from './components/layout/ActivityRibbon';
import { FileExplorer } from './components/layout/FileExplorer';
import { TabBar } from './components/layout/TabBar';
import { StatusBar } from './components/layout/StatusBar';
import { SettingsModal } from './components/settings/SettingsModal';
import { PdfExportModal } from './components/common/PdfExportModal';
import { MarkdownDocumentEditor } from './features/notes/MarkdownDocumentEditor';
import { SqliteWorkspace } from './features/tables/SqliteWorkspace';
import { DeckWorkspace } from './features/deck/DeckWorkspace';
import { OllamaSidebar } from './features/ai/OllamaSidebar';

const MainWorkspaceShell: React.FC = () => {
  const { activeTab, createNewWorkspaceFile } = useWorkspaceStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-[#161616] text-[#E6E6E6] overflow-hidden">
      {/* Main Window Body: Left Activity Ribbon + File Explorer + Central Multi-Tab Workspace + Right Ollama Panel */}
      <div className="flex-1 flex min-h-0">
        <ActivityRibbon />
        <FileExplorer />

        {/* Central Multi-Tab Workspace (#1E1E1E) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1E1E1E]">
          <TabBar />

          <div className="flex-1 min-h-0 overflow-hidden">
            {!activeTab ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#2A1B3D] border border-[#4A2574] flex items-center justify-center text-lg font-bold text-[#7E42C1] mb-3">
                  CW
                </div>
                <h1 className="text-base font-bold text-[#E6E6E6] mb-1">
                  Cascade Workspace
                </h1>
                <p className="text-xs text-[#9E9E9E] max-w-md mb-4">
                  Local-first Windows desktop productivity studio for Markdown notes (`.md`), native presentations (`.deck`), and SQLite databases (`.db`).
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => createNewWorkspaceFile('notes', 'quick-note', 'md')}
                    className="px-3 py-1.5 rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] font-semibold"
                  >
                    + New Markdown Note (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      createNewWorkspaceFile('presentations', 'new-deck', 'deck')
                    }
                    className="px-3 py-1.5 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574]"
                  >
                    + New Presentation (.deck)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      createNewWorkspaceFile('databases', 'metrics', 'db')
                    }
                    className="px-3 py-1.5 rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574]"
                  >
                    + New SQLite Database (.db)
                  </button>
                </div>
              </div>
            ) : activeTab.extension === 'deck' ? (
              <DeckWorkspace relativePath={activeTab.relativePath} />
            ) : activeTab.extension === 'db' || activeTab.extension === 'sqlite' ? (
              <SqliteWorkspace relativePath={activeTab.relativePath} />
            ) : (
              <MarkdownDocumentEditor relativePath={activeTab.relativePath} />
            )}
          </div>
        </main>

        {/* Right Collapsible Ollama AI Assistant Panel */}
        <OllamaSidebar />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Modals */}
      <SettingsModal />
      <PdfExportModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <MainWorkspaceShell />
    </WorkspaceProvider>
  );
};

export default App;
