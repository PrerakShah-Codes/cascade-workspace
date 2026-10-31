/**
 * Strongly typed IPC channel constants for Cascade Workspace.
 * Enforces strict separation between Renderer and Main processes.
 */

export const IPC_CHANNELS = {
  // Workspace & File System (fs-service)
  WORKSPACE_SELECT_DIR: 'cascade:workspace:select-dir',
  WORKSPACE_GET_TREE: 'cascade:workspace:get-tree',
  WORKSPACE_CREATE_FILE: 'cascade:workspace:create-file',
  WORKSPACE_CREATE_FOLDER: 'cascade:workspace:create-folder',
  WORKSPACE_READ_FILE: 'cascade:workspace:read-file',
  WORKSPACE_WRITE_FILE: 'cascade:workspace:write-file',
  WORKSPACE_DELETE_ITEM: 'cascade:workspace:delete-item',
  WORKSPACE_RENAME_ITEM: 'cascade:workspace:rename-item',
  WORKSPACE_COPY_ASSET: 'cascade:workspace:copy-asset',
  WORKSPACE_PICK_AND_COPY_ASSET: 'cascade:workspace:pick-and-copy-asset',
  WORKSPACE_SEARCH_FILES: 'cascade:workspace:search-files',
  WORKSPACE_FS_CHANGED: 'cascade:workspace:fs-changed',

  // SQLite Database Operations (sqlite-service)
  SQLITE_LIST_TABLES: 'cascade:sqlite:list-tables',
  SQLITE_GET_TABLE_SCHEMA: 'cascade:sqlite:get-table-schema',
  SQLITE_CREATE_TABLE: 'cascade:sqlite:create-table',
  SQLITE_DROP_TABLE: 'cascade:sqlite:drop-table',
  SQLITE_ADD_COLUMN: 'cascade:sqlite:add-column',
  SQLITE_RENAME_COLUMN: 'cascade:sqlite:rename-column',
  SQLITE_DROP_COLUMN: 'cascade:sqlite:drop-column',
  SQLITE_QUERY_TABLE_ROWS: 'cascade:sqlite:query-table-rows',
  SQLITE_INSERT_ROW: 'cascade:sqlite:insert-row',
  SQLITE_UPDATE_CELL: 'cascade:sqlite:update-cell',
  SQLITE_DELETE_ROWS: 'cascade:sqlite:delete-rows',
  SQLITE_EXECUTE_RAW: 'cascade:sqlite:execute-raw',

  // Native PDF Export (pdf-service)
  PDF_EXPORT_DOCUMENT: 'cascade:pdf:export-document',
  PDF_EXPORT_TABLE: 'cascade:pdf:export-table',
  PDF_EXPORT_DECK: 'cascade:pdf:export-deck'
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
