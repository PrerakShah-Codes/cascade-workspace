import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspace-store';

type SettingsCategoryKey =
  | 'workspace'
  | 'editor'
  | 'sqlite'
  | 'presentations'
  | 'ollama'
  | 'pdfExport';

const CATEGORIES: Array<{ key: SettingsCategoryKey; label: string; keywords: string }> = [
  {
    key: 'workspace',
    label: 'Workspace & Files',
    keywords: 'workspace folder path assets autosave local delete'
  },
  {
    key: 'editor',
    label: 'Editor & Appearance',
    keywords: 'markdown font size line height spellcheck split view theme'
  },
  {
    key: 'sqlite',
    label: 'SQLite & Tables',
    keywords: 'sqlite database page limit null destructive sql wal'
  },
  {
    key: 'presentations',
    label: 'Presentations',
    keywords: 'deck slides aspect ratio 16:9 4:3 transition speaker notes grid'
  },
  {
    key: 'ollama',
    label: 'Ollama & AI',
    keywords: 'ollama localhost 11434 model temperature workspace rag approval gate'
  },
  {
    key: 'pdfExport',
    label: 'PDF Export',
    keywords: 'pdf printToPDF dark light A4 Letter timestamps'
  }
];

/**
 * Cleanly categorized and searchable Settings Modal.
 * Categories: Workspace & Files, Editor & Appearance, SQLite & Tables,
 * Presentations, Ollama & AI, PDF Export.
 */
export const SettingsModal: React.FC = () => {
  const { settingsModalOpen, setSettingsModalOpen, settings, updateSettings } =
    useWorkspaceStore();

  const [activeCategory, setActiveCategory] = useState<SettingsCategoryKey>('workspace');
  const [searchFilter, setSearchFilter] = useState<string>('');

  if (!settingsModalOpen) return null;

  const filteredCategories = CATEGORIES.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.keywords.includes(q);
  });

  const currentCat =
    filteredCategories.find((c) => c.key === activeCategory)?.key ||
    filteredCategories[0]?.key ||
    'workspace';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl h-[540px] rounded-xl border border-[#4A2574] bg-[#161616] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#2D2D2D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574]">
              Preferences
            </span>
            <h2 className="text-base font-bold text-[#E6E6E6]">
              Cascade Workspace Settings
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search settings..."
              className="px-3 py-1 text-xs rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#4A2574] text-[#E6E6E6] focus:outline-none w-52"
            />
            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="px-2.5 py-1 text-xs rounded bg-[#1E1E1E] text-[#9E9E9E] hover:text-[#E6E6E6]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body: Left Category Navigation + Right Settings Controls */}
        <div className="flex-1 flex min-h-0">
          <nav className="w-56 bg-[#161616] border-r border-[#2D2D2D] p-2 space-y-1 overflow-y-auto">
            {filteredCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  currentCat === cat.key
                    ? 'bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]'
                    : 'text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E]'
                }`}
              >
                <span>{cat.label}</span>
                {currentCat === cat.key && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7E42C1]" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1 bg-[#1E1E1E] p-6 overflow-y-auto space-y-5 text-xs">
            {currentCat === 'workspace' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#E6E6E6] border-b border-[#2D2D2D] pb-2">
                  Workspace & Files (Local-First Storage)
                </h3>
                <div>
                  <label className="block text-[#9E9E9E] mb-1">
                    Active Local Workspace Path
                  </label>
                  <input
                    type="text"
                    value={settings.workspace.workspacePath}
                    onChange={(e) =>
                      updateSettings((s) => ({
                        ...s,
                        workspace: { ...s.workspace, workspacePath: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6] font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Media Assets Subdirectory
                    </label>
                    <input
                      type="text"
                      value={settings.workspace.assetsFolderName}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          workspace: { ...s.workspace, assetsFolderName: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Auto-Save Interval (ms)
                    </label>
                    <input
                      type="number"
                      value={settings.workspace.autoSaveIntervalMs}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          workspace: {
                            ...s.workspace,
                            autoSaveIntervalMs: Number(e.target.value)
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentCat === 'editor' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#E6E6E6] border-b border-[#2D2D2D] pb-2">
                  Editor & Appearance (#1E1E1E Obsidian Theme)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Default Note View Mode
                    </label>
                    <select
                      value={settings.editor.defaultNoteViewMode}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          editor: {
                            ...s.editor,
                            defaultNoteViewMode: e.target.value as
                              | 'split'
                              | 'live'
                              | 'reading'
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    >
                      <option value="split">Split-Pane (Source + Live Preview)</option>
                      <option value="live">Rich Document Editor</option>
                      <option value="reading">Reading View Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Editor Font Size (px)
                    </label>
                    <input
                      type="number"
                      value={settings.editor.fontSizePx}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          editor: {
                            ...s.editor,
                            fontSizePx: Number(e.target.value)
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentCat === 'sqlite' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#E6E6E6] border-b border-[#2D2D2D] pb-2">
                  SQLite & Tables (better-sqlite3 Engine)
                </h3>
                <p className="text-[#9E9E9E]">
                  Strictly native SQLite (`.db` / `.sqlite`) files with WAL journaling enabled. CSV import/export is intentionally excluded per local-first schema policy.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Default Grid Page Row Limit
                    </label>
                    <input
                      type="number"
                      value={settings.sqlite.defaultPageLimit}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          sqlite: {
                            ...s.sqlite,
                            defaultPageLimit: Number(e.target.value)
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      NULL Cell Badge Text
                    </label>
                    <input
                      type="text"
                      value={settings.sqlite.nullDisplayLabel}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          sqlite: {
                            ...s.sqlite,
                            nullDisplayLabel: e.target.value
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentCat === 'presentations' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#E6E6E6] border-b border-[#2D2D2D] pb-2">
                  Presentations (.deck Studio)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Default Slide Aspect Ratio
                    </label>
                    <select
                      value={settings.presentations.defaultAspectRatio}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          presentations: {
                            ...s.presentations,
                            defaultAspectRatio: e.target.value as '16:9' | '4:3'
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    >
                      <option value="16:9">16:9 Widescreen</option>
                      <option value="4:3">4:3 Technical Standard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Default Slide Transition
                    </label>
                    <select
                      value={settings.presentations.defaultTransition}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          presentations: {
                            ...s.presentations,
                            defaultTransition: e.target.value as
                              | 'none'
                              | 'fade'
                              | 'slide'
                              | 'zoom'
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    >
                      <option value="none">None</option>
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="zoom">Zoom</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentCat === 'ollama' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#E6E6E6] border-b border-[#2D2D2D] pb-2">
                  Ollama & AI Assistant
                </h3>
                <div>
                  <label className="block text-[#9E9E9E] mb-1">
                    Local Ollama Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={settings.ollama.baseUrl}
                    onChange={(e) =>
                      updateSettings((s) => ({
                        ...s,
                        ollama: { ...s.ollama, baseUrl: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6] font-mono"
                  />
                </div>
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#2A1B3D]/50 border border-[#4A2574] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ollama.allowSearchEntireWorkspace}
                    onChange={(e) =>
                      updateSettings((s) => ({
                        ...s,
                        ollama: {
                          ...s.ollama,
                          allowSearchEntireWorkspace: e.target.checked
                        }
                      }))
                    }
                    className="accent-[#7E42C1]"
                  />
                  <div>
                    <div className="font-semibold text-[#E6E6E6]">
                      Allow AI to search entire workspace
                    </div>
                    <div className="text-[11px] text-[#9E9E9E]">
                      When disabled, AI context is strictly restricted to active selection or explicitly attached pills.
                    </div>
                  </div>
                </label>
              </div>
            )}

            {currentCat === 'pdfExport' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#E6E6E6] border-b border-[#2D2D2D] pb-2">
                  PDF Export Pipeline (`webContents.printToPDF`)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Default Export Theme
                    </label>
                    <select
                      value={settings.pdfExport.defaultThemeMode}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          pdfExport: {
                            ...s.pdfExport,
                            defaultThemeMode: e.target.value as 'dark' | 'print-light'
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    >
                      <option value="dark">Obsidian Dark (#1E1E1E)</option>
                      <option value="print-light">Print Light (#FFFFFF)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#9E9E9E] mb-1">
                      Default Paper Size
                    </label>
                    <select
                      value={settings.pdfExport.defaultPageSize}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          pdfExport: {
                            ...s.pdfExport,
                            defaultPageSize: e.target.value as 'A4' | 'Letter'
                          }
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded bg-[#161616] border border-[#2D2D2D] text-[#E6E6E6]"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">US Letter</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2D2D2D] bg-[#161616] flex items-center justify-between">
          <span className="text-[11px] text-[#9E9E9E]">
            All preferences are stored locally in your workspace profile.
          </span>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
