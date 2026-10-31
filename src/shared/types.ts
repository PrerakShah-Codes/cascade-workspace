/**
 * Shared domain models for Cascade Workspace (.md, .deck, .db/.sqlite, Ollama AI, PDF, Settings).
 */

export type FileExtensionType = 'md' | 'deck' | 'db' | 'sqlite' | 'asset' | 'other';

export interface WorkspaceNode {
  id: string;
  name: string;
  relativePath: string;
  absolutePath: string;
  isDirectory: boolean;
  extension?: FileExtensionType;
  sizeBytes?: number;
  updatedAt: string;
  children?: WorkspaceNode[];
}

export interface WorkspaceSearchHit {
  relativePath: string;
  fileName: string;
  extension: FileExtensionType;
  lineNumber: number;
  snippet: string;
  fullContentExcerpt: string;
}

// ============================================================================
// Mathematical Function Graph Model (shared by .md and .deck)
// ============================================================================
export interface MathFunctionSeries {
  id: string;
  expression: string; // e.g. "sin(x)", "x^2 - 4", "0.5 * x^3 - 2*x"
  color: string;
  label?: string;
  visible?: boolean;
}

export interface MathGraphConfig {
  title?: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid: boolean;
  showDerivative?: boolean;
  functions: MathFunctionSeries[];
}

// ============================================================================
// Presentations (.deck Native JSON Schema)
// ============================================================================
export type SlideAspectRatio = '16:9' | '4:3';
export type SlideTransitionType = 'none' | 'fade' | 'slide' | 'zoom';
export type SlideLayoutPreset =
  | 'title'
  | 'title-content'
  | 'two-column'
  | 'section-header'
  | 'comparison'
  | 'math-focus'
  | 'diagram-focus'
  | 'blank';

export type SlideElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'latex'
  | 'mermaid'
  | 'mathgraph';

export type ShapeCategory = 'geometric' | 'arrows' | 'callouts' | 'flowchart';

export type ShapeKind =
  // Geometric
  | 'rectangle'
  | 'rounded'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'right-triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'parallelogram'
  // Lines, Arrows & Connectors
  | 'line'
  | 'divider'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-both'
  | 'connector-elbow'
  // Callouts, Badges & Banners
  | 'callout'
  | 'callout-cloud'
  | 'banner'
  | 'badge'
  | 'quote-box'
  // Flowchart Symbols
  | 'flow-process'
  | 'flow-decision'
  | 'flow-data'
  | 'flow-database'
  | 'flow-document'
  | 'flow-terminator'
  | 'flow-predefined';

export interface SlideElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '600';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  shapeKind?: ShapeKind;
  padding?: number;
}

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number; // Logical canvas coordinates (0 - 960)
  y: number; // Logical canvas coordinates (0 - 540 for 16:9, 0 - 720 for 4:3)
  width: number;
  height: number;
  zIndex: number;
  groupId?: string;
  locked?: boolean;
  rotation?: number;
  /**
   * Primary payload:
   * - text: Markdown/rich text content
   * - image: Relative workspace asset path e.g. "assets/diagram.png"
   * - shape: Optional text label inside shape
   * - latex: LaTeX formula string
   * - mermaid: Mermaid diagram DSL string
   * - mathgraph: JSON-serialized MathGraphConfig
   */
  content: string;
  style?: SlideElementStyle;
}

export interface SlideTransitionSpec {
  type: SlideTransitionType;
  durationMs: number;
}

export interface DeckSlide {
  id: string;
  title: string;
  layout: SlideLayoutPreset;
  background: string; // Hex color or CSS linear-gradient
  borderAccentColor?: string;
  transition: SlideTransitionSpec;
  speakerNotes: string;
  elements: SlideElement[];
}

export interface DeckThemeSettings {
  aspectRatio: SlideAspectRatio;
  defaultBackground: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface DeckDocument {
  schemaVersion: '1.0';
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  theme: DeckThemeSettings;
  slides: DeckSlide[];
}

// ============================================================================
// SQLite Database Domain Models (.db / .sqlite)
// ============================================================================
export type SqliteColumnAffinity = 'INTEGER' | 'REAL' | 'TEXT' | 'BLOB' | 'NUMERIC';

export interface SqliteColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  defaultValue: string | null;
  pk: boolean;
}

export interface SqliteTableSummary {
  name: string;
  rowCount: number;
  columns: SqliteColumnInfo[];
  createSql: string;
}

export interface SqliteFilterRule {
  column: string;
  operator: 'contains' | 'equals' | 'starts_with' | 'gt' | 'lt' | 'is_null' | 'not_null';
  value: string;
}

export interface SqliteTableQueryRequest {
  dbPath: string;
  tableName: string;
  limit?: number;
  offset?: number;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  filters?: SqliteFilterRule[];
}

export interface SqliteTableQueryResult {
  tableName: string;
  columns: SqliteColumnInfo[];
  rows: Record<string, unknown>[];
  totalRowCount: number;
  executionTimeMs: number;
}

export interface SqliteRawExecutionResult {
  statementType: 'SELECT' | 'MUTATION' | 'DDL' | 'ERROR';
  columns: string[];
  rows: Record<string, unknown>[];
  changes?: number;
  lastInsertRowid?: number | string;
  executionTimeMs: number;
  message: string;
  error?: string;
}

// ============================================================================
// Ollama AI Assistant, Source Citations & Approval Gate
// ============================================================================
export interface SourceCitation {
  relativePath: string;
  fileName: string;
  snippet?: string;
  lineStart?: number;
}

export type ProposedActionType =
  | 'append_markdown'
  | 'replace_markdown_selection'
  | 'insert_deck_slide'
  | 'execute_sqlite_mutation';

export interface ProposedActionPreview {
  id: string;
  type: ProposedActionType;
  targetRelativePath: string;
  title: string;
  summary: string;
  payload: {
    markdownContent?: string;
    slide?: DeckSlide;
    sqlStatement?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  appliedAt?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  contextPills?: string[];
  citations?: SourceCitation[];
  proposals?: ProposedActionPreview[];
}

// ============================================================================
// PDF Export Payloads
// ============================================================================
export type PdfThemeMode = 'dark' | 'print-light';

export interface PdfExportBaseOptions {
  title: string;
  outputRelativePath?: string;
  themeMode: PdfThemeMode;
  pageSize: 'A4' | 'Letter';
  landscape?: boolean;
  includeHeaderFooter?: boolean;
}

export interface PdfDocumentExportPayload extends PdfExportBaseOptions {
  kind: 'markdown';
  renderedHtml: string;
}

export interface PdfTableExportPayload extends PdfExportBaseOptions {
  kind: 'table';
  dbName: string;
  tableName: string;
  scope: 'full' | 'selection';
  columns: string[];
  rows: Record<string, unknown>[];
  sqlQueryUsed?: string;
}

export interface PdfDeckExportPayload extends PdfExportBaseOptions {
  kind: 'deck';
  deckTitle: string;
  aspectRatio: SlideAspectRatio;
  scope: 'all' | 'selected';
  slidesHtml: string[];
  includeSpeakerNotes: boolean;
}

export type PdfExportResult = {
  success: boolean;
  savedFilePath?: string;
  canceled?: boolean;
  error?: string;
};

// ============================================================================
// Categorized Application Settings
// ============================================================================
export interface CascadeSettings {
  workspace: {
    workspacePath: string;
    autoSaveIntervalMs: number;
    assetsFolderName: string;
    confirmBeforeDelete: boolean;
  };
  editor: {
    defaultNoteViewMode: 'split' | 'live' | 'reading';
    fontSizePx: number;
    lineHeight: number;
    spellcheck: boolean;
    showLineNumbers: boolean;
  };
  sqlite: {
    defaultPageLimit: number;
    confirmDestructiveSql: boolean;
    nullDisplayLabel: string;
  };
  presentations: {
    defaultAspectRatio: SlideAspectRatio;
    defaultTransition: SlideTransitionType;
    showGridSnapGuides: boolean;
    speakerNotesVisibleByDefault: boolean;
  };
  ollama: {
    baseUrl: string;
    selectedModel: string;
    temperature: number;
    allowSearchEntireWorkspace: boolean;
    requireApprovalForEdits: boolean;
  };
  pdfExport: {
    defaultThemeMode: PdfThemeMode;
    defaultPageSize: 'A4' | 'Letter';
    includeTimestamps: boolean;
  };
}
