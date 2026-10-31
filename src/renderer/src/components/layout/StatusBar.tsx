import React from 'react';
import { useWorkspaceStore } from '../../store/workspace-store';

export const StatusBar: React.FC = () => {
  const { workspaceRoot, activeTab, settings, statusMessage } = useWorkspaceStore();

  return (
    <footer className="h-6 bg-[#161616] border-t border-[#2D2D2D] px-3 flex items-center justify-between text-[11px] text-[#9E9E9E] select-none no-print">
      <div className="flex items-center gap-3 truncate">
        <span className="inline-flex items-center gap-1.5 text-[#E6E6E6]">
          <span className="w-2 h-2 rounded-full bg-[#7E42C1]" />
          Local-First Workspace
        </span>
        <span className="text-[#2D2D2D]">|</span>
        <span className="font-mono truncate max-w-[260px]">{workspaceRoot}</span>
        <span className="text-[#2D2D2D]">|</span>
        <span className="truncate text-[#E6E6E6]/90">{statusMessage}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {activeTab && (
          <span className="font-mono text-[#E6E6E6]">
            Active: {activeTab.relativePath}
          </span>
        )}
        <span className="px-1.5 py-0.2 rounded bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574] text-[10px]">
          AI Scope: {settings.ollama.allowSearchEntireWorkspace ? 'Full Workspace RAG' : 'Strict Tab Boundary'}
        </span>
      </div>
    </footer>
  );
};
