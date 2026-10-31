import React from 'react';
import { useWorkspaceStore } from '../../store/workspace-store';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab } = useWorkspaceStore();

  return (
    <div className="h-10 bg-[#161616] border-b border-[#2D2D2D] flex items-center overflow-x-auto select-none no-print">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const badgeColor =
          tab.extension === 'deck' || tab.extension === 'db' || tab.extension === 'sqlite'
            ? 'text-[#7E42C1]'
            : 'text-[#9E9E9E]';

        return (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group h-full flex items-center gap-2 px-3.5 border-r border-[#2D2D2D] text-xs cursor-pointer transition-colors shrink-0 ${
              isActive
                ? 'bg-[#1E1E1E] text-[#E6E6E6] border-t-2 border-t-[#7E42C1]'
                : 'bg-[#161616] text-[#9E9E9E] hover:bg-[#1E1E1E]/60 hover:text-[#E6E6E6]'
            }`}
          >
            <span className={`font-mono text-[10px] font-semibold ${badgeColor}`}>
              .{tab.extension}
            </span>
            <span className="font-medium truncate max-w-[160px]">{tab.fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="ml-1 rounded px-1 text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#2A1B3D]"
              title="Close Tab"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};
