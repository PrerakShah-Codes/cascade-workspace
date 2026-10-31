import React from 'react';
import { SourceCitation } from '../../../../shared/types';
import { useWorkspaceStore } from '../../store/workspace-store';

interface SourceCitationBadgeProps {
  citation: SourceCitation;
}

/**
 * Clickable Source Citation Badge (`Source: [filename.md]`).
 * Opens the cited workspace file directly in the Central Multi-Tab Workspace when clicked.
 */
export const SourceCitationBadge: React.FC<SourceCitationBadgeProps> = ({
  citation
}) => {
  const { openFileInTab } = useWorkspaceStore();

  return (
    <button
      type="button"
      onClick={() => openFileInTab(citation.relativePath)}
      title={citation.snippet ? `${citation.relativePath}: "${citation.snippet}"` : citation.relativePath}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574] transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#7E42C1]" />
      <span>Source: [{citation.fileName}]</span>
    </button>
  );
};
