import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import {
  PdfDeckExportPayload,
  PdfDocumentExportPayload,
  PdfExportResult,
  PdfTableExportPayload,
  SqliteColumnAffinity,
  SqliteColumnInfo,
  SqliteRawExecutionResult,
  SqliteTableQueryRequest,
  SqliteTableQueryResult,
  SqliteTableSummary,
  WorkspaceNode,
  WorkspaceSearchHit
} from '../shared/types';

export interface CascadeBridgeAPI {
  workspace: {
    selectDirectory: () => Promise<{ workspaceRoot: string; tree: WorkspaceNode[] } | null>;
    getTree: (relDir?: string) => Promise<{ workspaceRoot: string; tree: WorkspaceNode[] }>;
    createFile: (relativePath: string, initialContent?: string) => Promise<WorkspaceNode>;
    createFolder: (relativePath: string) => Promise<WorkspaceNode>;
    readFile: (relativePath: string) => Promise<string>;
    writeFile: (relativePath: string, content: string) => Promise<{ updatedAt: string }>;
    deleteItem: (relativePath: string) => Promise<boolean>;
    renameItem: (oldRelativePath: string, newRelativePath: string) => Promise<string>;
    copyAsset: (
      sourceAbsolutePath: string,
      preferredFileName?: string
    ) => Promise<{ relativePath: string; absolutePath: string; fileName: string }>;
    pickAndCopyAsset: () => Promise<{
      relativePath: string;
      absolutePath: string;
      fileName: string;
    } | null>;
    searchFiles: (query: string, maxResults?: number) => Promise<WorkspaceSearchHit[]>;
  };
  sqlite: {
    listTables: (dbPath: string) => Promise<SqliteTableSummary[]>;
    getTableSchema: (dbPath: string, tableName: string) => Promise<SqliteColumnInfo[]>;
    createTable: (
      dbPath: string,
      tableName: string,
      columns: Array<{
        name: string;
        type: SqliteColumnAffinity;
        notnull?: boolean;
        defaultValue?: string;
      }>
    ) => Promise<SqliteTableSummary>;
    dropTable: (dbPath: string, tableName: string) => Promise<boolean>;
    addColumn: (
      dbPath: string,
      tableName: string,
      columnName: string,
      columnType: SqliteColumnAffinity,
      defaultValue?: string
    ) => Promise<SqliteColumnInfo[]>;
    renameColumn: (
      dbPath: string,
      tableName: string,
      oldColumnName: string,
      newColumnName: string
    ) => Promise<SqliteColumnInfo[]>;
    dropColumn: (
      dbPath: string,
      tableName: string,
      columnName: string
    ) => Promise<SqliteColumnInfo[]>;
    queryTableRows: (request: SqliteTableQueryRequest) => Promise<SqliteTableQueryResult>;
    insertRow: (
      dbPath: string,
      tableName: string,
      values: Record<string, unknown>
    ) => Promise<{ lastInsertRowid: number | string; changes: number }>;
    updateCell: (
      dbPath: string,
      tableName: string,
      rowId: number | string,
      columnName: string,
      newValue: unknown,
      pkColumn?: string
    ) => Promise<{ changes: number }>;
    deleteRows: (
      dbPath: string,
      tableName: string,
      rowIds: Array<number | string>,
      pkColumn?: string
    ) => Promise<{ changes: number }>;
    executeRaw: (dbPath: string, sql: string) => Promise<SqliteRawExecutionResult>;
  };
  pdf: {
    exportDocument: (payload: PdfDocumentExportPayload) => Promise<PdfExportResult>;
    exportTable: (payload: PdfTableExportPayload) => Promise<PdfExportResult>;
    exportDeck: (payload: PdfDeckExportPayload) => Promise<PdfExportResult>;
  };
}

const cascadeAPI: CascadeBridgeAPI = {
  workspace: {
    selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_SELECT_DIR),
    getTree: (relDir = '') => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_GET_TREE, relDir),
    createFile: (relativePath, initialContent) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_CREATE_FILE, { relativePath, initialContent }),
    createFolder: (relativePath) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_CREATE_FOLDER, { relativePath }),
    readFile: (relativePath) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_READ_FILE, { relativePath }),
    writeFile: (relativePath, content) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_WRITE_FILE, { relativePath, content }),
    deleteItem: (relativePath) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_DELETE_ITEM, { relativePath }),
    renameItem: (oldRelativePath, newRelativePath) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_RENAME_ITEM, { oldRelativePath, newRelativePath }),
    copyAsset: (sourceAbsolutePath, preferredFileName) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_COPY_ASSET, {
        sourceAbsolutePath,
        preferredFileName
      }),
    pickAndCopyAsset: () => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_PICK_AND_COPY_ASSET),
    searchFiles: (query, maxResults) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_SEARCH_FILES, { query, maxResults })
  },
  sqlite: {
    listTables: (dbPath) => ipcRenderer.invoke(IPC_CHANNELS.SQLITE_LIST_TABLES, { dbPath }),
    getTableSchema: (dbPath, tableName) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_GET_TABLE_SCHEMA, { dbPath, tableName }),
    createTable: (dbPath, tableName, columns) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_CREATE_TABLE, { dbPath, tableName, columns }),
    dropTable: (dbPath, tableName) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_DROP_TABLE, { dbPath, tableName }),
    addColumn: (dbPath, tableName, columnName, columnType, defaultValue) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_ADD_COLUMN, {
        dbPath,
        tableName,
        columnName,
        columnType,
        defaultValue
      }),
    renameColumn: (dbPath, tableName, oldColumnName, newColumnName) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_RENAME_COLUMN, {
        dbPath,
        tableName,
        oldColumnName,
        newColumnName
      }),
    dropColumn: (dbPath, tableName, columnName) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_DROP_COLUMN, { dbPath, tableName, columnName }),
    queryTableRows: (request) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_QUERY_TABLE_ROWS, request),
    insertRow: (dbPath, tableName, values) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_INSERT_ROW, { dbPath, tableName, values }),
    updateCell: (dbPath, tableName, rowId, columnName, newValue, pkColumn) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_UPDATE_CELL, {
        dbPath,
        tableName,
        rowId,
        columnName,
        newValue,
        pkColumn
      }),
    deleteRows: (dbPath, tableName, rowIds, pkColumn) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_DELETE_ROWS, {
        dbPath,
        tableName,
        rowIds,
        pkColumn
      }),
    executeRaw: (dbPath, sql) =>
      ipcRenderer.invoke(IPC_CHANNELS.SQLITE_EXECUTE_RAW, { dbPath, sql })
  },
  pdf: {
    exportDocument: (payload) => ipcRenderer.invoke(IPC_CHANNELS.PDF_EXPORT_DOCUMENT, payload),
    exportTable: (payload) => ipcRenderer.invoke(IPC_CHANNELS.PDF_EXPORT_TABLE, payload),
    exportDeck: (payload) => ipcRenderer.invoke(IPC_CHANNELS.PDF_EXPORT_DECK, payload)
  }
};

contextBridge.exposeInMainWorld('cascadeAPI', cascadeAPI);

declare global {
  interface Window {
    cascadeAPI?: CascadeBridgeAPI;
  }
}
