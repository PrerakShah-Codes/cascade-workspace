import React from 'react';
import { ProposedActionPreview } from '../../../../shared/types';

interface ProposalApprovalCardProps {
  proposal: ProposedActionPreview;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * User Control & Approval Gate Card.
 * The AI must NEVER silently overwrite a file, slide, or SQLite table.
 * Renders `[✓ Approve & Apply]` (`#4A2574`) and `[✕ Reject]` (`#2D2D2D`) buttons.
 */
export const ProposalApprovalCard: React.FC<ProposalApprovalCardProps> = ({
  proposal,
  onApprove,
  onReject
}) => {
  const previewCode =
    proposal.payload.markdownContent ||
    proposal.payload.sqlStatement ||
    (proposal.payload.slide
      ? `Slide: "${proposal.payload.slide.title}" (${proposal.payload.slide.elements.length} elements)`
      : '');

  return (
    <div className="mt-2.5 rounded-lg border border-[#4A2574] bg-[#1E1E1E] p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574]">
          Proposed Action Preview
        </span>
        <span className="font-mono text-[11px] text-[#9E9E9E]">
          {proposal.targetRelativePath}
        </span>
      </div>

      <div className="font-semibold text-[#E6E6E6]">{proposal.title}</div>
      <div className="text-[11px] text-[#9E9E9E]">{proposal.summary}</div>

      {previewCode && (
        <pre className="p-2 rounded bg-[#161616] border border-[#2D2D2D] text-[11px] font-mono text-[#E6E6E6] overflow-x-auto whitespace-pre-wrap">
          {previewCode.trim()}
        </pre>
      )}

      {proposal.status === 'pending' ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onApprove}
            style={{ backgroundColor: '#4A2574' }}
            className="flex-1 py-1.5 px-2.5 rounded font-semibold text-[#E6E6E6] hover:bg-[#7E42C1] transition-colors"
          >
            [✓ Approve &amp; Apply]
          </button>
          <button
            type="button"
            onClick={onReject}
            style={{ backgroundColor: '#2D2D2D' }}
            className="py-1.5 px-3 rounded font-medium text-[#E6E6E6] hover:bg-[#3D3D3D] transition-colors"
          >
            [✕ Reject]
          </button>
        </div>
      ) : (
        <div
          className={`py-1 px-2.5 rounded text-[11px] font-semibold text-center ${
            proposal.status === 'approved'
              ? 'bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]'
              : 'bg-[#2D2D2D] text-[#9E9E9E]'
          }`}
        >
          {proposal.status === 'approved'
            ? '✓ Approved & Applied to Local File'
            : '✕ Rejected — File Untouched'}
        </div>
      )}
    </div>
  );
};
