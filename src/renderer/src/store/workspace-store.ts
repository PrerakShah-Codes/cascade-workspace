import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react';
import {
  AiChatMessage,
  CascadeSettings,
  DeckDocument,
  DeckSlide,
  FileExtensionType,
  ProposedActionPreview,
  SqliteTableSummary,
  WorkspaceNode
} from '../../../shared/types';
import { DeckHistoryState } from '../features/deck/deck-commands';

export interface OpenWorkspaceTab {
  id: string;
  relativePath: string;
  fileName: string;
  extension: FileExtensionType;
  isDirty: boolean;
}

export interface DeckSessionCacheEntry {
  activeSlideId: string;
  selectedSlideIds: string[];
  selectedElementIds: string[];
  speakerNotesOpen: boolean;
  history: DeckHistoryState;
}

export const DEFAULT_SETTINGS: CascadeSettings = {
  workspace: {
    workspacePath: './workspace',
    autoSaveIntervalMs: 3000,
    assetsFolderName: 'assets',
    confirmBeforeDelete: true
  },
  editor: {
    defaultNoteViewMode: 'split',
    fontSizePx: 15,
    lineHeight: 1.65,
    spellcheck: true,
    showLineNumbers: true
  },
  sqlite: {
    defaultPageLimit: 100,
    confirmDestructiveSql: true,
    nullDisplayLabel: 'NULL'
  },
  presentations: {
    defaultAspectRatio: '16:9',
    defaultTransition: 'fade',
    showGridSnapGuides: true,
    speakerNotesVisibleByDefault: true
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    selectedModel: 'llama3.1:8b',
    temperature: 0.3,
    allowSearchEntireWorkspace: false, // Strict Context Boundary default OFF
    requireApprovalForEdits: true
  },
  pdfExport: {
    defaultThemeMode: 'dark',
    defaultPageSize: 'A4',
    includeTimestamps: true
  }
};

/**
 * Rich initial local files for fallback/demo when running in browser preview or fresh workspace.
 */
const INITIAL_FILES_MAP: Record<string, string> = {
  'notes/architecture-overview.md': `# Cascade Workspace — System Architecture

Welcome to **Cascade Workspace**, a local-first Windows desktop productivity studio built with Electron, Vite, TypeScript, and SQLite.

> **Callout:** Everything in your workspace lives strictly on your local disk. Media files embedded in notes or presentations are automatically copied to \`assets/\` using relative paths.

## 1. Mathematical & Scientific Modeling (KaTeX)

Inline Euler identity $e^{i\\pi} + 1 = 0$ and Gaussian distribution density:

$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\left( -\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2 \\right)$$

## 2. Interactive Mathematical Function Graph

\`\`\`mathgraph
{
  "title": "Damped Harmonic Oscillator vs Quadratic Envelope",
  "xMin": -6,
  "xMax": 6,
  "yMin": -3,
  "yMax": 5,
  "showGrid": true,
  "functions": [
    { "id": "fn-1", "expression": "sin(x) * cos(0.4*x) * 2.2", "color": "#7E42C1", "label": "f(x) = 2.2 sin(x)cos(0.4x)" },
    { "id": "fn-2", "expression": "0.25 * x^2 - 1.5", "color": "#38BDF8", "label": "g(x) = 0.25x^2 - 1.5" }
  ]
}
\`\`\`

---pagebreak---

## 3. Local-First IPC & Security Flow (Mermaid)

\`\`\`mermaid
flowchart LR
  Renderer["React 18 Renderer (#1E1E1E)"] --> Preload["contextBridge (window.cascadeAPI)"]
  Preload --> Main["Electron Main Process"]
  Main --> FS["FsService (<workspace>/assets/)"]
  Main --> SQL["SqliteService (better-sqlite3)"]
  Main --> PDF["PdfService (printToPDF)"]
\`\`\`
`,
  'notes/quantum-harmonics.md': `# Quantum Harmonic Eigenstates

The time-independent Schrödinger equation for a 1D harmonic potential $V(x) = \\frac{1}{2}kx^2$:

$$-\\frac{\\hbar^2}{2m}\\frac{d^2\\psi}{dx^2} + \\frac{1}{2}kx^2\\psi = E\\psi$$

\`\`\`mathgraph
{
  "title": "Wavefunction Probability Density & Potential Well",
  "xMin": -4,
  "xMax": 4,
  "yMin": -1.5,
  "yMax": 4,
  "showGrid": true,
  "functions": [
    { "id": "q-1", "expression": "0.35 * x^2", "color": "#9E9E9E", "label": "V(x) = 0.35x^2" },
    { "id": "q-2", "expression": "exp(-0.5 * x^2) * cos(2*x) * 1.6", "color": "#7E42C1", "label": "psi_2(x)" }
  ]
}
\`\`\`
`,
  'presentations/q4-engineering-review.deck': JSON.stringify(
    {
      schemaVersion: '1.0',
      title: 'Q4 Systems Engineering & Telemetry Review',
      author: '',
      createdAt: '2026-10-24T10:00:00.000Z',
      updatedAt: '2026-10-24T14:30:00.000Z',
      theme: {
        aspectRatio: '16:9',
        defaultBackground: '#1E1E1E',
        accentColor: '#7E42C1',
        headingFont: 'Inter',
        bodyFont: 'Inter'
      },
      slides: [
        {
          id: 'slide-1',
          title: 'Cascade Workspace 1.0 Architecture',
          layout: 'title',
          background: 'linear-gradient(135deg, #1E1E1E 0%, #2A1B3D 100%)',
          borderAccentColor: '#4A2574',
          transition: { type: 'fade', durationMs: 450 },
          speakerNotes:
            'Open with the local-first manifesto: zero cloud latency, native SQLite speed, and deterministic PDF rendering.',
          elements: [
            {
              id: 'el-1',
              type: 'text',
              x: 65,
              y: 75,
              width: 830,
              height: 75,
              zIndex: 1,
              content: 'Cascade Workspace 1.0 Architecture',
              style: { fontSize: 38, fontWeight: 'bold', color: '#E6E6E6', textAlign: 'left' }
            },
            {
              id: 'el-2',
              type: 'text',
              x: 65,
              y: 158,
              width: 800,
              height: 58,
              zIndex: 2,
              content:
                'Combining Markdown Documents, .deck Presentations, Native SQLite Tables & Local Ollama AI',
              style: { fontSize: 19, color: '#9E9E9E', textAlign: 'left' }
            },
            {
              id: 'el-shape-flow-1',
              type: 'shape',
              x: 65,
              y: 235,
              width: 240,
              height: 82,
              zIndex: 3,
              content: 'Markdown + KaTeX',
              style: {
                shapeKind: 'flow-process',
                backgroundColor: '#2A1B3D',
                borderColor: '#7E42C1',
                borderWidth: 2,
                color: '#E6E6E6',
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center'
              }
            },
            {
              id: 'el-shape-arrow-1',
              type: 'shape',
              x: 320,
              y: 248,
              width: 120,
              height: 56,
              zIndex: 4,
              content: 'IPC',
              style: {
                shapeKind: 'arrow-right',
                backgroundColor: '#4A2574',
                borderColor: '#7E42C1',
                borderWidth: 2,
                color: '#E6E6E6',
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            {
              id: 'el-shape-db-1',
              type: 'shape',
              x: 455,
              y: 225,
              width: 210,
              height: 100,
              zIndex: 5,
              content: 'SQLite WAL Engine',
              style: {
                shapeKind: 'flow-database',
                backgroundColor: '#2A1B3D',
                borderColor: '#7E42C1',
                borderWidth: 2,
                color: '#E6E6E6',
                fontSize: 15,
                fontWeight: 'bold',
                textAlign: 'center'
              }
            },
            {
              id: 'el-3',
              type: 'latex',
              x: 65,
              y: 350,
              width: 600,
              height: 115,
              zIndex: 6,
              content:
                '\\mathcal{L}_{\\text{throughput}}(N) = \\frac{N \\cdot B_{\\text{WAL}}}{\\tau_{\\text{IPC}} + \\tau_{\\text{disk}}}',
              style: { backgroundColor: '#161616', borderColor: '#4A2574', color: '#E6E6E6' }
            }
          ]
        },
        {
          id: 'slide-2',
          title: 'Latency & Signal Convergence Modeling',
          layout: 'math-focus',
          background: '#1E1E1E',
          borderAccentColor: '#7E42C1',
          transition: { type: 'slide', durationMs: 400 },
          speakerNotes:
            'Highlight the interactive f(x) mathematical graph embedded directly on the slide canvas.',
          elements: [
            {
              id: 'el-201',
              type: 'text',
              x: 50,
              y: 35,
              width: 860,
              height: 55,
              zIndex: 1,
              content: 'Signal Processing & Sub-Millisecond SQLite Latency Curve',
              style: { fontSize: 28, fontWeight: 'bold', color: '#E6E6E6', textAlign: 'left' }
            },
            {
              id: 'el-202',
              type: 'mathgraph',
              x: 50,
              y: 105,
              width: 500,
              height: 360,
              zIndex: 2,
              content: JSON.stringify({
                title: 'Throughput Response f(x)',
                xMin: -5,
                xMax: 5,
                yMin: -2,
                yMax: 4,
                showGrid: true,
                functions: [
                  { id: 's-1', expression: 'sin(x) + 0.3*x^2', color: '#7E42C1', label: 'sin(x) + 0.3x^2' },
                  { id: 's-2', expression: 'cos(1.5*x)', color: '#38BDF8', label: 'cos(1.5x)' }
                ]
              })
            },
            {
              id: 'el-203',
              type: 'mermaid',
              x: 575,
              y: 105,
              width: 335,
              height: 360,
              zIndex: 3,
              content:
                'graph TD\n  UI[Slide Canvas] --> IPC[IPC Bridge]\n  IPC --> Assets[/assets/ Media Store]\n  IPC --> PDF[webContents.printToPDF]'
            }
          ]
        }
      ]
    } satisfies DeckDocument,
    null,
    2
  )
};

export interface InMemorySqliteDatabase {
  tables: Record<
    string,
    {
      summary: SqliteTableSummary;
      rows: Record<string, unknown>[];
    }
  >;
}

const INITIAL_SQLITE_DB: Record<string, InMemorySqliteDatabase> = {
  'databases/engineering-metrics.db': {
    tables: {
      benchmark_runs: {
        summary: {
          name: 'benchmark_runs',
          rowCount: 5,
          createSql:
            'CREATE TABLE "benchmark_runs" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "subsystem" TEXT NOT NULL, "operation" TEXT, "latency_ms" REAL, "throughput_ops" INTEGER, "status" TEXT)',
          columns: [
            { cid: 0, name: 'id', type: 'INTEGER', notnull: true, defaultValue: null, pk: true },
            { cid: 1, name: 'subsystem', type: 'TEXT', notnull: true, defaultValue: null, pk: false },
            { cid: 2, name: 'operation', type: 'TEXT', notnull: false, defaultValue: null, pk: false },
            { cid: 3, name: 'latency_ms', type: 'REAL', notnull: false, defaultValue: '0.0', pk: false },
            { cid: 4, name: 'throughput_ops', type: 'INTEGER', notnull: false, defaultValue: '0', pk: false },
            { cid: 5, name: 'status', type: 'TEXT', notnull: false, defaultValue: "'PASS'", pk: false }
          ]
        },
        rows: [
          { _rowid_: 1, id: 1, subsystem: 'better-sqlite3', operation: 'WAL Batch Insert (10k)', latency_ms: 4.18, throughput_ops: 239000, status: 'PASS' },
          { _rowid_: 2, id: 2, subsystem: 'better-sqlite3', operation: 'Indexed Join Query', latency_ms: 0.62, throughput_ops: 161290, status: 'PASS' },
          { _rowid_: 3, id: 3, subsystem: 'KaTeX Engine', operation: 'Block Formula Render', latency_ms: 1.15, throughput_ops: 86950, status: 'PASS' },
          { _rowid_: 4, id: 4, subsystem: 'PrintToPDF IPC', operation: '16:9 Deck Export', latency_ms: 142.5, throughput_ops: 700, status: 'OPTIMAL' },
          { _rowid_: 5, id: 5, subsystem: 'Ollama Local RAG', operation: 'Scoped Context Prompt', latency_ms: 28.4, throughput_ops: 3520, status: 'PASS' }
        ]
      },
      workspace_assets_audit: {
        summary: {
          name: 'workspace_assets_audit',
          rowCount: 3,
          createSql:
            'CREATE TABLE "workspace_assets_audit" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "asset_path" TEXT, "referenced_by" TEXT, "size_kb" REAL)',
          columns: [
            { cid: 0, name: 'id', type: 'INTEGER', notnull: true, defaultValue: null, pk: true },
            { cid: 1, name: 'asset_path', type: 'TEXT', notnull: false, defaultValue: null, pk: false },
            { cid: 2, name: 'referenced_by', type: 'TEXT', notnull: false, defaultValue: null, pk: false },
            { cid: 3, name: 'size_kb', type: 'REAL', notnull: false, defaultValue: null, pk: false }
          ]
        },
        rows: [
          { _rowid_: 1, id: 1, asset_path: 'assets/system-topology.svg', referenced_by: 'notes/architecture-overview.md', size_kb: 18.4 },
          { _rowid_: 2, id: 2, asset_path: 'assets/oscillator-plot.svg', referenced_by: 'presentations/q4-engineering-review.deck', size_kb: 24.1 },
          { _rowid_: 3, id: 3, asset_path: 'assets/schema-diagram.png', referenced_by: 'notes/quantum-harmonics.md', size_kb: 62.0 }
        ]
      }
    }
  }
};

interface WorkspaceStoreValue {
  workspaceRoot: string;
  tree: WorkspaceNode[];
  tabs: OpenWorkspaceTab[];
  activeTabId: string | null;
  activeTab: OpenWorkspaceTab | null;
  leftSidebarOpen: boolean;
  leftSidebarView: 'explorer' | 'search';
  leftSidebarWidth: number;
  rightAiPanelOpen: boolean;
  rightAiPanelWidth: number;
  settingsModalOpen: boolean;
  pdfExportModalState: {
    open: boolean;
    mode: 'markdown' | 'table' | 'deck';
    customTitle?: string;
  };
  settings: CascadeSettings;
  fileContents: Record<string, string>;
  inMemoryDbs: Record<string, InMemorySqliteDatabase>;
  aiMessages: AiChatMessage[];
  statusMessage: string;
  deckSessionCache: Record<string, DeckSessionCacheEntry>;

  // Actions
  setLeftSidebarOpen: (open: boolean) => void;
  setLeftSidebarView: (view: 'explorer' | 'search') => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightAiPanelOpen: (open: boolean) => void;
  setRightAiPanelWidth: (width: number) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setPdfExportModalState: (state: {
    open: boolean;
    mode: 'markdown' | 'table' | 'deck';
    customTitle?: string;
  }) => void;
  updateSettings: (updater: (prev: CascadeSettings) => CascadeSettings) => void;
  openFileInTab: (relativePath: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  readFileContent: (relativePath: string) => Promise<string>;
  saveFileContent: (relativePath: string, content: string) => Promise<void>;
  createNewWorkspaceFile: (
    folderRelPath: string,
    fileName: string,
    ext: 'md' | 'deck' | 'db'
  ) => Promise<void>;
  createNewWorkspaceFolder: (folderRelPath: string) => Promise<void>;
  deleteWorkspaceItem: (relativePath: string) => Promise<void>;
  copyExternalAssetToWorkspace: (preferredName?: string) => Promise<string>;
  refreshWorkspaceTree: () => Promise<void>;
  selectWorkspaceDirectory: () => Promise<void>;
  addAiMessage: (msg: AiChatMessage) => void;
  handleProposalDecision: (
    messageId: string,
    proposalId: string,
    decision: 'approved' | 'rejected'
  ) => Promise<void>;
  setStatusMessage: (msg: string) => void;
  setInMemoryDbs: React.Dispatch<React.SetStateAction<Record<string, InMemorySqliteDatabase>>>;
  updateDeckSessionCache: (
    relativePath: string,
    entry: Partial<DeckSessionCacheEntry>
  ) => void;
}

const WorkspaceStoreContext = createContext<WorkspaceStoreValue | null>(null);

function classifyExt(name: string): FileExtensionType {
  const lower = name.toLowerCase();
  if (lower.endsWith('.md')) return 'md';
  if (lower.endsWith('.deck')) return 'deck';
  if (lower.endsWith('.db')) return 'db';
  if (lower.endsWith('.sqlite')) return 'sqlite';
  if (/\.(png|jpg|jpeg|svg|gif|webp)$/.test(lower)) return 'asset';
  return 'other';
}

function buildFallbackTreeFromPaths(
  filePaths: string[],
  dbPaths: string[]
): WorkspaceNode[] {
  const allPaths = Array.from(
    new Set([...filePaths, ...dbPaths, 'assets/system-topology.svg'])
  );

  const folders: Record<string, WorkspaceNode> = {};
  const rootNodes: WorkspaceNode[] = [];

  for (const rel of allPaths) {
    const parts = rel.split('/');
    if (parts.length > 1) {
      const dirName = parts[0];
      if (!folders[dirName]) {
        folders[dirName] = {
          id: `dir:${dirName}`,
          name: dirName,
          relativePath: dirName,
          absolutePath: `./workspace/${dirName}`,
          isDirectory: true,
          updatedAt: '2026-10-24T10:00:00.000Z',
          children: []
        };
        rootNodes.push(folders[dirName]);
      }
      const fileName = parts.slice(1).join('/');
      folders[dirName].children!.push({
        id: `file:${rel}`,
        name: fileName,
        relativePath: rel,
        absolutePath: `./workspace/${rel}`,
        isDirectory: false,
        extension: classifyExt(fileName),
        sizeBytes: 4096,
        updatedAt: '2026-10-24T10:00:00.000Z'
      });
    } else {
      rootNodes.push({
        id: `file:${rel}`,
        name: rel,
        relativePath: rel,
        absolutePath: `./workspace/${rel}`,
        isDirectory: false,
        extension: classifyExt(rel),
        sizeBytes: 1024,
        updatedAt: '2026-10-24T10:00:00.000Z'
      });
    }
  }

  return rootNodes;
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaceRoot, setWorkspaceRoot] = useState<string>(
    DEFAULT_SETTINGS.workspace.workspacePath
  );
  const [fileContents, setFileContents] = useState<Record<string, string>>(INITIAL_FILES_MAP);
  const fileContentsRef = useRef<Record<string, string>>(INITIAL_FILES_MAP);
  fileContentsRef.current = fileContents;

  const [inMemoryDbs, setInMemoryDbs] =
    useState<Record<string, InMemorySqliteDatabase>>(INITIAL_SQLITE_DB);

  // Only recompute the file path signature when files are added/removed,
  // never on every keystroke or canvas element drag.
  const filePathSignature = useMemo(
    () => Object.keys(fileContents).sort().join('|'),
    [fileContents]
  );
  const dbPathSignature = useMemo(
    () => Object.keys(inMemoryDbs).sort().join('|'),
    [inMemoryDbs]
  );

  const [tree, setTree] = useState<WorkspaceNode[]>(() =>
    buildFallbackTreeFromPaths(
      Object.keys(INITIAL_FILES_MAP),
      Object.keys(INITIAL_SQLITE_DB)
    )
  );

  const [tabs, setTabs] = useState<OpenWorkspaceTab[]>([
    {
      id: 'tab-notes/architecture-overview.md',
      relativePath: 'notes/architecture-overview.md',
      fileName: 'architecture-overview.md',
      extension: 'md',
      isDirty: false
    },
    {
      id: 'tab-presentations/q4-engineering-review.deck',
      relativePath: 'presentations/q4-engineering-review.deck',
      fileName: 'q4-engineering-review.deck',
      extension: 'deck',
      isDirty: false
    },
    {
      id: 'tab-databases/engineering-metrics.db',
      relativePath: 'databases/engineering-metrics.db',
      fileName: 'engineering-metrics.db',
      extension: 'db',
      isDirty: false
    }
  ]);

  const [activeTabId, setActiveTabId] = useState<string | null>(
    'tab-presentations/q4-engineering-review.deck'
  );
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [leftSidebarView, setLeftSidebarView] = useState<'explorer' | 'search'>('explorer');
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(256);
  const [rightAiPanelOpen, setRightAiPanelOpen] = useState<boolean>(true);
  const [rightAiPanelWidth, setRightAiPanelWidth] = useState<number>(320);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [pdfExportModalState, setPdfExportModalState] = useState<{
    open: boolean;
    mode: 'markdown' | 'table' | 'deck';
    customTitle?: string;
  }>({
    open: false,
    mode: 'markdown'
  });

  const [settings, setSettings] = useState<CascadeSettings>(DEFAULT_SETTINGS);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Local workspace ready • Zero telemetry • SQLite WAL active'
  );
  const [deckSessionCache, setDeckSessionCache] = useState<
    Record<string, DeckSessionCacheEntry>
  >({});

  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Connected to local Ollama assistant (`http://localhost:11434`). Context is strictly scoped to your active selection/tab unless you enable **"Allow AI to search entire workspace"** above. Any proposed edits to `.md`, `.deck`, or `.db` files require your explicit approval.',
      createdAt: new Date().toISOString(),
      citations: [
        {
          relativePath: 'notes/architecture-overview.md',
          fileName: 'architecture-overview.md',
          snippet: 'Local-First IPC & Security Flow'
        }
      ],
      proposals: [
        {
          id: 'prop-demo-1',
          type: 'append_markdown',
          targetRelativePath: 'notes/architecture-overview.md',
          title: 'Append Section 4: SQLite WAL Concurrency Summary',
          summary:
            'Appends a technical callout and KaTeX throughput bound to architecture-overview.md',
          payload: {
            markdownContent:
              '\n## 4. SQLite WAL Concurrency Bound\n\n> **Performance Note:** Prepared statements in `better-sqlite3` achieve $\\mathcal{O}(1)$ statement caching with zero serialization overhead.\n'
          },
          status: 'pending'
        }
      ]
    }
  ]);

  const seededWorkspaceRef = useRef<boolean>(false);

  const refreshWorkspaceTree = useCallback(async () => {
    if (window.cascadeAPI) {
      let res = await window.cascadeAPI.workspace.getTree('');
      const hasAnyFile = res.tree.some(
        (n) => !n.isDirectory || (n.children && n.children.length > 0)
      );
      if (!hasAnyFile && !seededWorkspaceRef.current) {
        seededWorkspaceRef.current = true;
        for (const [relPath, starterContent] of Object.entries(INITIAL_FILES_MAP)) {
          await window.cascadeAPI.workspace.writeFile(relPath, starterContent);
        }
        res = await window.cascadeAPI.workspace.getTree('');
      }
      setWorkspaceRoot(res.workspaceRoot);
      setTree(res.tree);
    } else {
      const fileKeys = filePathSignature ? filePathSignature.split('|') : [];
      const dbKeys = dbPathSignature ? dbPathSignature.split('|') : [];
      setTree(buildFallbackTreeFromPaths(fileKeys, dbKeys));
    }
  }, [filePathSignature, dbPathSignature]);

  useEffect(() => {
    refreshWorkspaceTree();
  }, [refreshWorkspaceTree]);

  const selectWorkspaceDirectory = useCallback(async () => {
    if (window.cascadeAPI) {
      const res = await window.cascadeAPI.workspace.selectDirectory();
      if (res) {
        setWorkspaceRoot(res.workspaceRoot);
        setTree(res.tree);
        setStatusMessage(`Opened workspace: ${res.workspaceRoot}`);
      }
    }
  }, []);

  const readFileContent = useCallback(async (relativePath: string): Promise<string> => {
    if (window.cascadeAPI) {
      try {
        const text = await window.cascadeAPI.workspace.readFile(relativePath);
        if (text) {
          setFileContents((prev) =>
            prev[relativePath] === text ? prev : { ...prev, [relativePath]: text }
          );
          return text;
        }
        const fallback = fileContentsRef.current[relativePath] ?? '';
        if (fallback) {
          await window.cascadeAPI.workspace.writeFile(relativePath, fallback);
        }
        return fallback;
      } catch {
        return fileContentsRef.current[relativePath] ?? '';
      }
    }
    return fileContentsRef.current[relativePath] ?? '';
  }, []);

  const writeTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const saveFileContent = useCallback(async (relativePath: string, content: string) => {
    setFileContents((prev) =>
      prev[relativePath] === content ? prev : { ...prev, [relativePath]: content }
    );
    if (window.cascadeAPI) {
      if (writeTimersRef.current[relativePath]) {
        clearTimeout(writeTimersRef.current[relativePath]);
      }
      writeTimersRef.current[relativePath] = setTimeout(async () => {
        try {
          if (window.cascadeAPI) {
            await window.cascadeAPI.workspace.writeFile(relativePath, content);
          }
        } catch {
          // Ignore transient write errors in preview
        }
      }, 220);
    }
  }, []);

  const openFileInTab = useCallback(async (relativePath: string) => {
    const tabId = `tab-${relativePath}`;
    const fileName = relativePath.split('/').pop() || relativePath;
    const ext = classifyExt(fileName);

    setTabs((prev) => {
      if (prev.some((t) => t.id === tabId)) return prev;
      return [
        ...prev,
        {
          id: tabId,
          relativePath,
          fileName,
          extension: ext,
          isDirty: false
        }
      ];
    });
    setActiveTabId(tabId);
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          setActiveTabId(next.length > 0 ? next[next.length - 1].id : null);
        }
        return next;
      });
    },
    [activeTabId]
  );

  const createNewWorkspaceFile = useCallback(
    async (folderRelPath: string, fileName: string, ext: 'md' | 'deck' | 'db') => {
      const cleanName = fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;
      const relPath = folderRelPath ? `${folderRelPath}/${cleanName}` : cleanName;

      if (window.cascadeAPI) {
        await window.cascadeAPI.workspace.createFile(relPath);
        await refreshWorkspaceTree();
      } else {
        if (ext === 'db') {
          setInMemoryDbs((prev) => ({
            ...prev,
            [relPath]: {
              tables: {
                records: {
                  summary: {
                    name: 'records',
                    rowCount: 1,
                    createSql:
                      'CREATE TABLE "records" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "title" TEXT, "category" TEXT, "metric" REAL)',
                    columns: [
                      { cid: 0, name: 'id', type: 'INTEGER', notnull: true, defaultValue: null, pk: true },
                      { cid: 1, name: 'title', type: 'TEXT', notnull: false, defaultValue: null, pk: false },
                      { cid: 2, name: 'category', type: 'TEXT', notnull: false, defaultValue: null, pk: false },
                      { cid: 3, name: 'metric', type: 'REAL', notnull: false, defaultValue: '0', pk: false }
                    ]
                  },
                  rows: [{ _rowid_: 1, id: 1, title: 'Initial Entry', category: 'General', metric: 100.0 }]
                }
              }
            }
          }));
        } else if (ext === 'deck') {
          const baseTitle = cleanName.replace(/\.deck$/i, '');
          const starterDeck: DeckDocument = {
            schemaVersion: '1.0',
            title: baseTitle,
            author: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            theme: {
              aspectRatio: '16:9',
              defaultBackground: '#1E1E1E',
              accentColor: '#7E42C1',
              headingFont: 'Inter',
              bodyFont: 'Inter'
            },
            slides: [
              {
                id: `slide-${Date.now()}`,
                title: baseTitle,
                layout: 'title',
                background: 'linear-gradient(135deg, #1E1E1E 0%, #2A1B3D 100%)',
                borderAccentColor: '#4A2574',
                transition: { type: 'fade', durationMs: 400 },
                speakerNotes: 'Opening slide speaker notes.',
                elements: [
                  {
                    id: `el-${Date.now()}`,
                    type: 'text',
                    x: 80,
                    y: 180,
                    width: 800,
                    height: 90,
                    zIndex: 1,
                    content: baseTitle,
                    style: { fontSize: 42, fontWeight: 'bold', color: '#E6E6E6', textAlign: 'center' }
                  }
                ]
              }
            ]
          };
          setFileContents((prev) => ({
            ...prev,
            [relPath]: JSON.stringify(starterDeck, null, 2)
          }));
        } else {
          const baseTitle = cleanName.replace(/\.md$/i, '');
          setFileContents((prev) => ({
            ...prev,
            [relPath]: `# ${baseTitle}\n\nStart writing with **Markdown**, LaTeX math ($f(x) = x^2$), or \`\`\`mermaid\`\`\` diagrams.\n`
          }));
        }
      }

      await openFileInTab(relPath);
      setStatusMessage(`Created ${relPath}`);
    },
    [openFileInTab, refreshWorkspaceTree]
  );

  const createNewWorkspaceFolder = useCallback(
    async (folderRelPath: string) => {
      if (window.cascadeAPI) {
        await window.cascadeAPI.workspace.createFolder(folderRelPath);
        await refreshWorkspaceTree();
      }
      setStatusMessage(`Created folder ${folderRelPath}`);
    },
    [refreshWorkspaceTree]
  );

  const deleteWorkspaceItem = useCallback(
    async (relativePath: string) => {
      if (window.cascadeAPI) {
        await window.cascadeAPI.workspace.deleteItem(relativePath);
        await refreshWorkspaceTree();
      } else {
        setFileContents((prev) => {
          const copy = { ...prev };
          delete copy[relativePath];
          return copy;
        });
        setInMemoryDbs((prev) => {
          const copy = { ...prev };
          delete copy[relativePath];
          return copy;
        });
      }
      closeTab(`tab-${relativePath}`);
      setStatusMessage(`Deleted ${relativePath}`);
    },
    [closeTab, refreshWorkspaceTree]
  );

  const copyExternalAssetToWorkspace = useCallback(
    async (preferredName?: string): Promise<string> => {
      if (window.cascadeAPI) {
        const picked = await window.cascadeAPI.workspace.pickAndCopyAsset();
        if (picked) {
          await refreshWorkspaceTree();
          setStatusMessage(`Copied media to ${picked.relativePath}`);
          return picked.relativePath;
        }
      }
      const fallbackName = preferredName || `figure-${Date.now().toString().slice(-4)}.svg`;
      const relPath = `${settings.workspace.assetsFolderName}/${fallbackName}`;
      setStatusMessage(`Copied asset into ${relPath}`);
      return relPath;
    },
    [refreshWorkspaceTree, settings.workspace.assetsFolderName]
  );

  const updateSettings = useCallback(
    (updater: (prev: CascadeSettings) => CascadeSettings) => {
      setSettings((prev) => updater(prev));
      setStatusMessage('Updated Cascade Workspace settings');
    },
    []
  );

  const addAiMessage = useCallback((msg: AiChatMessage) => {
    setAiMessages((prev) => [...prev, msg]);
  }, []);

  const updateDeckSessionCache = useCallback(
    (relativePath: string, entry: Partial<DeckSessionCacheEntry>) => {
      setDeckSessionCache((prev) => {
        const existing = prev[relativePath];
        return {
          ...prev,
          [relativePath]: {
            activeSlideId: entry.activeSlideId ?? existing?.activeSlideId ?? '',
            selectedSlideIds:
              entry.selectedSlideIds ?? existing?.selectedSlideIds ?? [],
            selectedElementIds:
              entry.selectedElementIds ?? existing?.selectedElementIds ?? [],
            speakerNotesOpen:
              entry.speakerNotesOpen ?? existing?.speakerNotesOpen ?? true,
            history: entry.history ?? existing?.history
          } as DeckSessionCacheEntry
        };
      });
    },
    []
  );

  const handleProposalDecision = useCallback(
    async (
      messageId: string,
      proposalId: string,
      decision: 'approved' | 'rejected'
    ) => {
      let targetProposal: ProposedActionPreview | undefined;
      setAiMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.proposals) return m;
          return {
            ...m,
            proposals: m.proposals.map((p) => {
              if (p.id === proposalId) {
                targetProposal = p;
                return {
                  ...p,
                  status: decision,
                  appliedAt: decision === 'approved' ? new Date().toISOString() : undefined
                };
              }
              return p;
            })
          };
        })
      );

      if (decision === 'rejected' || !targetProposal) {
        setStatusMessage('Rejected proposed AI edit — workspace files untouched');
        return;
      }

      if (
        targetProposal.type === 'append_markdown' &&
        targetProposal.payload.markdownContent
      ) {
        const current = await readFileContent(targetProposal.targetRelativePath);
        const updated = `${current.trimEnd()}\n\n${targetProposal.payload.markdownContent.trim()}\n`;
        await saveFileContent(targetProposal.targetRelativePath, updated);
        await openFileInTab(targetProposal.targetRelativePath);
        setStatusMessage(`Approved & applied Markdown edit to ${targetProposal.targetRelativePath}`);
      } else if (
        targetProposal.type === 'insert_deck_slide' &&
        targetProposal.payload.slide
      ) {
        const raw = await readFileContent(targetProposal.targetRelativePath);
        try {
          const deck: DeckDocument = JSON.parse(raw);
          const newSlide: DeckSlide = targetProposal.payload.slide;
          deck.slides.push(newSlide);
          deck.updatedAt = new Date().toISOString();
          await saveFileContent(
            targetProposal.targetRelativePath,
            JSON.stringify(deck, null, 2)
          );
          await openFileInTab(targetProposal.targetRelativePath);
          setStatusMessage(`Approved & inserted new slide into ${targetProposal.targetRelativePath}`);
        } catch {
          setStatusMessage('Failed to apply slide proposal: invalid .deck JSON');
        }
      } else if (
        targetProposal.type === 'execute_sqlite_mutation' &&
        targetProposal.payload.sqlStatement
      ) {
        if (window.cascadeAPI) {
          await window.cascadeAPI.sqlite.executeRaw(
            targetProposal.targetRelativePath,
            targetProposal.payload.sqlStatement
          );
        }
        await openFileInTab(targetProposal.targetRelativePath);
        setStatusMessage(
          `Approved & executed SQL mutation on ${targetProposal.targetRelativePath}`
        );
      }
    },
    [openFileInTab, readFileContent, saveFileContent]
  );

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || null,
    [tabs, activeTabId]
  );

  const contextValue = useMemo<WorkspaceStoreValue>(
    () => ({
      workspaceRoot,
      tree,
      tabs,
      activeTabId,
      activeTab,
      leftSidebarOpen,
      leftSidebarView,
      leftSidebarWidth,
      rightAiPanelOpen,
      rightAiPanelWidth,
      settingsModalOpen,
      pdfExportModalState,
      settings,
      fileContents,
      inMemoryDbs,
      aiMessages,
      statusMessage,
      deckSessionCache,
      setLeftSidebarOpen,
      setLeftSidebarView,
      setLeftSidebarWidth,
      setRightAiPanelOpen,
      setRightAiPanelWidth,
      setSettingsModalOpen,
      setPdfExportModalState,
      updateSettings,
      openFileInTab,
      closeTab,
      setActiveTabId,
      readFileContent,
      saveFileContent,
      createNewWorkspaceFile,
      createNewWorkspaceFolder,
      deleteWorkspaceItem,
      copyExternalAssetToWorkspace,
      refreshWorkspaceTree,
      selectWorkspaceDirectory,
      addAiMessage,
      handleProposalDecision,
      setStatusMessage,
      setInMemoryDbs,
      updateDeckSessionCache
    }),
    [
      workspaceRoot,
      tree,
      tabs,
      activeTabId,
      activeTab,
      leftSidebarOpen,
      leftSidebarView,
      leftSidebarWidth,
      rightAiPanelOpen,
      rightAiPanelWidth,
      settingsModalOpen,
      pdfExportModalState,
      settings,
      fileContents,
      inMemoryDbs,
      aiMessages,
      statusMessage,
      deckSessionCache,
      updateSettings,
      openFileInTab,
      closeTab,
      readFileContent,
      saveFileContent,
      createNewWorkspaceFile,
      createNewWorkspaceFolder,
      deleteWorkspaceItem,
      copyExternalAssetToWorkspace,
      refreshWorkspaceTree,
      selectWorkspaceDirectory,
      addAiMessage,
      handleProposalDecision,
      updateDeckSessionCache
    ]
  );

  return React.createElement(
    WorkspaceStoreContext.Provider,
    { value: contextValue },
    children
  );
};

export function useWorkspaceStore(): WorkspaceStoreValue {
  const ctx = useContext(WorkspaceStoreContext);
  if (!ctx) {
    throw new Error('useWorkspaceStore must be used inside a WorkspaceProvider.');
  }
  return ctx;
}
