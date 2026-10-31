import React, { useState } from 'react';
import { WorkspaceNode } from '../../../../shared/types';
import { useWorkspaceStore } from '../../store/workspace-store';

/**
 * File Explorer Sidebar & Global Search (`#161616`) with interactive drag-resize splitter.
 * Supports creating new `.md` notes, `.deck` presentations, `.db` SQLite databases, and folders.
 */
export const FileExplorer: React.FC = () => {
  const {
    leftSidebarOpen,
    leftSidebarView,
    leftSidebarWidth,
    setLeftSidebarWidth,
    setLeftSidebarOpen,
    tree,
    activeTab,
    openFileInTab,
    createNewWorkspaceFile,
    createNewWorkspaceFolder,
    deleteWorkspaceItem,
    selectWorkspaceDirectory,
    fileContents
  } = useWorkspaceStore();

  const [newItemType, setNewItemType] = useState<'md' | 'deck' | 'db' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});

  if (!leftSidebarOpen) return null;

  const handleStartResize = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = leftSidebarWidth;

    const onMove = (moveEvt: MouseEvent): void => {
      const nextW = Math.max(180, Math.min(440, startW + (moveEvt.clientX - startX)));
      setLeftSidebarWidth(nextW);
    };

    const onUp = (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleCreateSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed || !newItemType) return;

    if (newItemType === 'folder') {
      await createNewWorkspaceFolder(trimmed);
    } else {
      const defaultDir =
        newItemType === 'md'
          ? 'notes'
          : newItemType === 'deck'
          ? 'presentations'
          : 'databases';
      await createNewWorkspaceFile(defaultDir, trimmed, newItemType);
    }
    setNewItemName('');
    setNewItemType(null);
  };

  const renderBadge = (ext?: string): React.ReactNode => {
    if (ext === 'md') {
      return (
        <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-[#1E1E1E] text-[#9E9E9E] border border-[#2D2D2D]">
          .md
        </span>
      );
    }
    if (ext === 'deck') {
      return (
        <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574]">
          .deck
        </span>
      );
    }
    if (ext === 'db' || ext === 'sqlite') {
      return (
        <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574]">
          .db
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-[#1E1E1E] text-[#9E9E9E]">
        asset
      </span>
    );
  };

  const renderNode = (node: WorkspaceNode, depth = 0): React.ReactNode => {
    if (node.isDirectory) {
      const isCollapsed = Boolean(collapsedDirs[node.relativePath]);
      return (
        <div key={node.id}>
          <button
            type="button"
            onClick={() =>
              setCollapsedDirs((prev) => ({
                ...prev,
                [node.relativePath]: !prev[node.relativePath]
              }))
            }
            style={{ paddingLeft: `${depth * 12 + 10}px` }}
            className="w-full flex items-center gap-1.5 py-1.5 pr-2 text-xs font-semibold text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E] transition-colors"
          >
            <span className="text-[10px]">{isCollapsed ? '▸' : '▾'}</span>
            <span className="truncate">{node.name}</span>
          </button>
          {!isCollapsed &&
            node.children?.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }

    const isSelected = activeTab?.relativePath === node.relativePath;
    return (
      <div
        key={node.id}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 text-xs cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[#2A1B3D] text-[#E6E6E6] border-l-2 border-[#7E42C1]'
            : 'text-[#E6E6E6]/90 hover:bg-[#1E1E1E]'
        }`}
        onClick={() => openFileInTab(node.relativePath)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {renderBadge(node.extension)}
          <span className="truncate">{node.name}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteWorkspaceItem(node.relativePath);
          }}
          title={`Delete ${node.name}`}
          className="opacity-0 group-hover:opacity-100 px-1 text-[#9E9E9E] hover:text-red-400"
        >
          ×
        </button>
      </div>
    );
  };

  const searchResults = Object.entries(fileContents).filter(([relPath, text]) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return relPath.toLowerCase().includes(q) || text.toLowerCase().includes(q);
  });

  return (
    <aside
      style={{ width: `${leftSidebarWidth}px` }}
      className="relative shrink-0 bg-[#161616] border-r border-[#2D2D2D] flex flex-col select-none no-print"
    >
      {leftSidebarView === 'explorer' ? (
        <>
          <div className="p-3 border-b border-[#2D2D2D] flex items-center justify-between gap-1">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">
                Local Workspace
              </div>
              <div className="text-xs font-semibold text-[#E6E6E6] truncate">
                CascadeWorkspace
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={selectWorkspaceDirectory}
                className="px-2 py-1 text-[11px] rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D]"
                title="Switch Local Workspace Folder"
              >
                Folder…
              </button>
              <button
                type="button"
                onClick={() => setLeftSidebarOpen(false)}
                className="px-1.5 py-1 text-[11px] rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D]"
                title="Collapse File Explorer"
              >
                «
              </button>
            </div>
          </div>

          {/* Quick Create Actions Bar (.md, .deck, .db, Folder) */}
          <div className="grid grid-cols-4 gap-1 p-2 border-b border-[#2D2D2D] bg-[#161616]">
            <button
              type="button"
              onClick={() => setNewItemType('md')}
              className="py-1 px-1.5 rounded text-[11px] font-medium bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D] hover:border-[#4A2574]"
              title="New Markdown Note (.md)"
            >
              + .md
            </button>
            <button
              type="button"
              onClick={() => setNewItemType('deck')}
              className="py-1 px-1.5 rounded text-[11px] font-medium bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#7E42C1] border border-[#2D2D2D] hover:border-[#4A2574]"
              title="New Presentation (.deck)"
            >
              + .deck
            </button>
            <button
              type="button"
              onClick={() => setNewItemType('db')}
              className="py-1 px-1.5 rounded text-[11px] font-medium bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#7E42C1] border border-[#2D2D2D] hover:border-[#4A2574]"
              title="New SQLite Database (.db)"
            >
              + .db
            </button>
            <button
              type="button"
              onClick={() => setNewItemType('folder')}
              className="py-1 px-1.5 rounded text-[11px] font-medium bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D]"
              title="New Subfolder"
            >
              + Dir
            </button>
          </div>

          {newItemType && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-2 bg-[#2A1B3D]/50 border-b border-[#4A2574] space-y-1.5"
            >
              <div className="text-[11px] text-[#E6E6E6] font-medium">
                Create new {newItemType === 'folder' ? 'Folder' : `.${newItemType} file`}
              </div>
              <input
                type="text"
                autoFocus
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={
                  newItemType === 'folder'
                    ? 'folder-name'
                    : `untitled.${newItemType}`
                }
                className="w-full px-2 py-1 text-xs rounded bg-[#1E1E1E] border border-[#4A2574] text-[#E6E6E6] focus:outline-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setNewItemType(null)}
                  className="px-2 py-0.5 text-[11px] rounded bg-[#2D2D2D] text-[#9E9E9E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-0.5 text-[11px] font-semibold rounded bg-[#4A2574] text-[#E6E6E6]"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Tree View */}
          <div className="flex-1 overflow-y-auto py-1">
            {tree.map((node) => renderNode(node))}
          </div>
        </>
      ) : (
        /* Global Search View */
        <div className="flex-1 flex flex-col p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">
              Global Workspace Search
            </span>
            <button
              type="button"
              onClick={() => setLeftSidebarOpen(false)}
              className="px-1.5 py-0.5 text-[11px] rounded bg-[#1E1E1E] text-[#9E9E9E] hover:text-[#E6E6E6]"
            >
              «
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes & slides..."
            className="w-full px-2.5 py-1.5 text-xs rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#4A2574] text-[#E6E6E6] focus:outline-none mb-3"
          />
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {searchResults.map(([relPath, text]) => (
              <button
                key={relPath}
                type="button"
                onClick={() => openFileInTab(relPath)}
                className="w-full text-left p-2 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] border border-[#2D2D2D] hover:border-[#4A2574]"
              >
                <div className="text-xs font-medium text-[#E6E6E6] truncate">
                  {relPath}
                </div>
                <div className="text-[11px] text-[#9E9E9E] line-clamp-2 mt-0.5">
                  {text.slice(0, 120)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Right Edge Drag-Resize Handle */}
      <div
        onMouseDown={handleStartResize}
        title="Drag to resize File Explorer panel"
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#7E42C1]/60 transition-colors z-30"
      />
    </aside>
  );
};
