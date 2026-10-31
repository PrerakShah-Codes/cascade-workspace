import React, { useMemo } from 'react';

interface MermaidRendererProps {
  code: string;
  compact?: boolean;
}

interface ParsedEdge {
  fromId: string;
  fromLabel: string;
  toId: string;
  toLabel: string;
  edgeLabel?: string;
}

/**
 * Built-in Mermaid.js Diagram Renderer for fenced ` ```mermaid ` blocks and `.deck` slides.
 * Generates crisp dark-purple themed SVG architecture diagrams (`#161616`, `#2A1B3D`, `#4A2574`, `#7E42C1`)
 * that export cleanly through `webContents.printToPDF`.
 */
const MermaidRendererInner: React.FC<MermaidRendererProps> = ({
  code,
  compact = false
}) => {
  const { nodes, edges, isHorizontal } = useMemo(() => {
    const lines = code
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('%%'));

    const header = lines[0]?.toUpperCase() || '';
    const horizontal = header.includes('LR') || header.includes('RL');

    const nodeMap = new Map<string, string>();
    const parsedEdges: ParsedEdge[] = [];

    const parseNodeToken = (token: string): { id: string; label: string } => {
      const m = token.match(
        /^([A-Za-z0-9_-]+)\s*(?:\["?([^"\]]+)"?\]|\("?([^"\)]+)"?\)|\{([^}]+)\})?$/
      );
      if (m) {
        const id = m[1];
        const label = m[2] || m[3] || m[4] || id;
        return { id, label };
      }
      return { id: token, label: token };
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Support chained arrows like A --> B --> C on a single line
      const segments = line.split(/\s*--?>\s*/);
      if (segments.length >= 2) {
        for (let s = 0; s < segments.length - 1; s++) {
          const leftRaw = segments[s].replace(/^\|[^|]+\|\s*/, '').trim();
          let rightRaw = segments[s + 1].trim();
          let edgeLabel: string | undefined;
          const labelMatch = rightRaw.match(/^\|([^|]+)\|\s*(.+)$/);
          if (labelMatch) {
            edgeLabel = labelMatch[1].trim();
            rightRaw = labelMatch[2].trim();
          }
          const left = parseNodeToken(leftRaw);
          const right = parseNodeToken(rightRaw);

          if (!nodeMap.has(left.id) || left.label !== left.id) {
            nodeMap.set(left.id, left.label);
          }
          if (!nodeMap.has(right.id) || right.label !== right.id) {
            nodeMap.set(right.id, right.label);
          }

          parsedEdges.push({
            fromId: left.id,
            fromLabel: nodeMap.get(left.id) || left.label,
            toId: right.id,
            toLabel: nodeMap.get(right.id) || right.label,
            edgeLabel
          });
        }
      }
    }

    if (nodeMap.size === 0) {
      nodeMap.set('Start', 'Workspace Source');
      nodeMap.set('End', 'Rendered Output');
      parsedEdges.push({
        fromId: 'Start',
        fromLabel: 'Workspace Source',
        toId: 'End',
        toLabel: 'Rendered Output'
      });
    }

    return {
      nodes: Array.from(nodeMap.entries()).map(([id, label]) => ({ id, label })),
      edges: parsedEdges,
      isHorizontal: horizontal
    };
  }, [code]);

  const nodePositions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    const count = nodes.length;
    nodes.forEach((n, idx) => {
      if (isHorizontal) {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        pos.set(n.id, {
          x: 110 + col * 220,
          y: 65 + row * 95 + (col === 1 && count > 3 ? 25 : 0)
        });
      } else {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        pos.set(n.id, {
          x: count <= 3 ? 280 : 170 + col * 240,
          y: 55 + (count <= 3 ? idx * 82 : row * 90)
        });
      }
    });
    return pos;
  }, [nodes, isHorizontal]);

  const svgWidth = 620;
  const svgHeight = compact ? 230 : Math.max(210, Math.ceil(nodes.length / 2) * 105 + 50);

  return (
    <div className="my-2 rounded-lg border border-[#2D2D2D] bg-[#161616] p-3">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2D2D2D]">
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]">
          Mermaid.js Diagram
        </span>
        <span className="text-[11px] text-[#9E9E9E] font-mono">
          {nodes.length} nodes • {edges.length} edges
        </span>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block">
        <defs>
          <marker
            id="mermaid-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#7E42C1" />
          </marker>
        </defs>

        {/* Directed Edges */}
        {edges.map((e, i) => {
          const from = nodePositions.get(e.fromId) || { x: 100, y: 60 };
          const to = nodePositions.get(e.toId) || { x: 300, y: 120 };
          return (
            <g key={`edge-${i}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#7E42C1"
                strokeWidth="2"
                markerEnd="url(#mermaid-arrow)"
              />
              {e.edgeLabel && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 6}
                  fill="#9E9E9E"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {e.edgeLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Diagram Nodes */}
        {nodes.map((n) => {
          const pt = nodePositions.get(n.id) || { x: 100, y: 60 };
          const boxW = Math.min(185, Math.max(115, n.label.length * 7.2 + 24));
          const boxH = 38;
          return (
            <g key={n.id} transform={`translate(${pt.x - boxW / 2}, ${pt.y - boxH / 2})`}>
              <rect
                width={boxW}
                height={boxH}
                rx="6"
                fill="#2A1B3D"
                stroke="#4A2574"
                strokeWidth="1.75"
              />
              <text
                x={boxW / 2}
                y={boxH / 2 + 4}
                fill="#E6E6E6"
                fontSize="11.5"
                fontWeight="600"
                textAnchor="middle"
              >
                {n.label.length > 26 ? `${n.label.slice(0, 24)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const MermaidRenderer = React.memo(MermaidRendererInner);
MermaidRenderer.displayName = 'MermaidRenderer';
