import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspace-store';
import { OllamaClient, OllamaModelTag } from '../../services/ollama-client';
import { SourceCitationBadge } from './SourceCitationBadge';
import { ProposalApprovalCard } from './ProposalApprovalCard';

/**
 * Right Collapsible & Resizable Ollama AI Assistant Sidebar (`#161616`).
 * Connects to local Ollama (`http://localhost:11434`), enforces Strict Context Boundary,
 * renders clickable `Source: [filename.md]` citations, and gates all mutations behind
 * Proposed Action Preview Cards.
 */
export const OllamaSidebar: React.FC = () => {
  const {
    rightAiPanelOpen,
    rightAiPanelWidth,
    setRightAiPanelWidth,
    setRightAiPanelOpen,
    settings,
    updateSettings,
    activeTab,
    fileContents,
    aiMessages,
    addAiMessage,
    handleProposalDecision
  } = useWorkspaceStore();

  const [models, setModels] = useState<OllamaModelTag[]>([
    { name: 'llama3.1:8b' },
    { name: 'qwen2.5-coder:7b' }
  ]);
  const [daemonOnline, setDaemonOnline] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    OllamaClient.fetchInstalledModels(settings.ollama.baseUrl).then((res) => {
      if (!active) return;
      setDaemonOnline(res.online);
      setModels(res.models);
    });
    return () => {
      active = false;
    };
  }, [settings.ollama.baseUrl]);

  if (!rightAiPanelOpen) return null;

  const handleStartResize = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = rightAiPanelWidth;

    const onMove = (moveEvt: MouseEvent): void => {
      const nextW = Math.max(260, Math.min(520, startW - (moveEvt.clientX - startX)));
      setRightAiPanelWidth(nextW);
    };

    const onUp = (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const trimmed = promptInput.trim();
    if (!trimmed || sending) return;

    const userMsgId = `msg-user-${Date.now()}`;
    addAiMessage({
      id: userMsgId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
      contextPills: activeTab ? [activeTab.relativePath] : []
    });
    setPromptInput('');
    setSending(true);

    try {
      const activeContent = activeTab
        ? fileContents[activeTab.relativePath] || ''
        : '';

      const response = await OllamaClient.generateAssistantResponse({
        baseUrl: settings.ollama.baseUrl,
        model: settings.ollama.selectedModel,
        temperature: settings.ollama.temperature,
        userPrompt: trimmed,
        activeFileRelativePath: activeTab?.relativePath,
        activeFileContent: activeContent,
        allowSearchEntireWorkspace: settings.ollama.allowSearchEntireWorkspace,
        workspaceSearchFn: async (q) => {
          if (window.cascadeAPI) {
            return window.cascadeAPI.workspace.searchFiles(q, 5);
          }
          return Object.entries(fileContents)
            .filter(
              ([rel, txt]) =>
                rel.toLowerCase().includes(q.toLowerCase()) ||
                txt.toLowerCase().includes(q.toLowerCase())
            )
            .map(([rel, txt]) => ({
              relativePath: rel,
              fileName: rel.split('/').pop() || rel,
              extension: 'md',
              lineNumber: 1,
              snippet: txt.split('\n')[0] || '',
              fullContentExcerpt: txt.slice(0, 400)
            }));
        }
      });

      addAiMessage({
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: response.replyText,
        createdAt: new Date().toISOString(),
        citations: response.citations,
        proposals: response.proposals
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <aside
      style={{ width: `${rightAiPanelWidth}px` }}
      className="relative shrink-0 bg-[#161616] border-l border-[#2D2D2D] flex flex-col select-none no-print"
    >
      {/* Interactive Left Edge Drag-Resize Handle */}
      <div
        onMouseDown={handleStartResize}
        title="Drag to resize Ollama AI Assistant panel"
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-[#7E42C1]/60 transition-colors z-30"
      />

      {/* Header & Model Picker */}
      <div className="p-3 border-b border-[#2D2D2D] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                daemonOnline ? 'bg-emerald-400' : 'bg-[#7E42C1]'
              }`}
            />
            <span className="text-xs font-bold text-[#E6E6E6]">
              Local Ollama AI Assistant
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#9E9E9E]">
              /api/tags
            </span>
            <button
              type="button"
              onClick={() => setRightAiPanelOpen(false)}
              title="Collapse AI Assistant Panel"
              className="px-1.5 py-0.5 text-[11px] rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D]"
            >
              »
            </button>
          </div>
        </div>

        <select
          value={settings.ollama.selectedModel}
          onChange={(e) =>
            updateSettings((s) => ({
              ...s,
              ollama: { ...s.ollama, selectedModel: e.target.value }
            }))
          }
          className="w-full px-2.5 py-1.5 text-xs rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#4A2574] text-[#E6E6E6] font-mono"
        >
          {models.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Strict Context Boundary Toggle */}
        <label className="flex items-start gap-2 p-2 rounded-lg bg-[#1E1E1E] border border-[#2D2D2D] hover:border-[#4A2574] cursor-pointer">
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
            className="mt-0.5 accent-[#7E42C1]"
          />
          <div className="text-[11px] leading-snug">
            <div className="font-semibold text-[#E6E6E6]">
              Allow AI to search entire workspace
            </div>
            <div className="text-[10px] text-[#9E9E9E]">
              {settings.ollama.allowSearchEntireWorkspace
                ? 'Full workspace indexing active'
                : 'Restricted strictly to attached pill / active selection'}
            </div>
          </div>
        </label>

        {/* Active Context Pill */}
        {activeTab && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#9E9E9E]">Attached Context:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]">
              {activeTab.fileName}
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {aiMessages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`rounded-lg p-3 text-xs leading-relaxed ${
                isUser
                  ? 'bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574] ml-4'
                  : 'bg-[#1E1E1E] text-[#E6E6E6] border border-[#2D2D2D]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-[#9E9E9E] mb-1">
                <span className="font-semibold uppercase">
                  {isUser ? 'You' : 'Ollama Assistant'}
                </span>
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="whitespace-pre-wrap select-text">{msg.content}</div>

              {/* Clickable Source Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#2D2D2D] flex flex-wrap gap-1.5">
                  {msg.citations.map((cit, i) => (
                    <SourceCitationBadge
                      key={`${msg.id}-cit-${i}`}
                      citation={cit}
                    />
                  ))}
                </div>
              )}

              {/* Proposed Action Preview Cards (Approval Gate) */}
              {msg.proposals &&
                msg.proposals.map((prop) => (
                  <ProposalApprovalCard
                    key={prop.id}
                    proposal={prop}
                    onApprove={() =>
                      handleProposalDecision(msg.id, prop.id, 'approved')
                    }
                    onReject={() =>
                      handleProposalDecision(msg.id, prop.id, 'rejected')
                    }
                  />
                ))}
            </div>
          );
        })}
      </div>

      {/* Prompt Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-[#2D2D2D] bg-[#161616] space-y-2"
      >
        <textarea
          rows={2}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder="Ask local Ollama to summarize, critique slides, or draft SQL..."
          className="w-full p-2 text-xs rounded-lg bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#4A2574] text-[#E6E6E6] resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#9E9E9E]">
            Edits require explicit user approval
          </span>
          <button
            type="submit"
            disabled={sending}
            className="px-3 py-1 text-xs font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] disabled:opacity-40"
          >
            {sending ? 'Thinking…' : 'Send ↵'}
          </button>
        </div>
      </form>
    </aside>
  );
};
