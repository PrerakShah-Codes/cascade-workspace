import * as path from 'path';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import {
  PdfDeckExportPayload,
  PdfDocumentExportPayload,
  PdfTableExportPayload,
  SqliteColumnAffinity,
  SqliteTableQueryRequest
} from '../shared/types';
import { FsService } from './services/fs-service';
import { SqliteService } from './services/sqlite-service';
import { PdfService } from './services/pdf-service';

export interface IpcRouterDependencies {
  fsService: FsService;
  sqliteService: SqliteService;
  pdfService: PdfService;
}

/**
 * Registers all strongly typed IPC handlers between Main and Renderer processes.
 */
export function registerIpcHandlers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipcMain: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dialog: any,
  deps: IpcRouterDependencies
): void {
  const { fsService, sqliteService, pdfService } = deps;

  // ==========================================================================
  // Workspace & File System Handlers
  // ==========================================================================
  ipcMain.handle(IPC_CHANNELS.WORKSPACE_SELECT_DIR, async () => {
    const res = await dialog.showOpenDialog({
      title: 'Open Local Cascade Workspace Folder',
      properties: ['openDirectory', 'createDirectory']
    });
    if (res.canceled || !res.filePaths?.[0]) {
      return null;
    }
    const chosen = res.filePaths[0];
    fsService.setWorkspaceRoot(chosen);
    pdfService.setWorkspaceRoot(chosen);
    await fsService.ensureWorkspaceStructure();
    return {
      workspaceRoot: chosen,
      tree: await fsService.getWorkspaceTree('')
    };
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_GET_TREE, async (_e: unknown, relDir = '') => {
    return {
      workspaceRoot: fsService.getWorkspaceRoot(),
      tree: await fsService.getWorkspaceTree(relDir)
    };
  });

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_CREATE_FILE,
    async (_e: unknown, payload: { relativePath: string; initialContent?: string }) => {
      return fsService.createFile(payload.relativePath, payload.initialContent);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_CREATE_FOLDER,
    async (_e: unknown, payload: { relativePath: string }) => {
      return fsService.createFolder(payload.relativePath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_READ_FILE,
    async (_e: unknown, payload: { relativePath: string }) => {
      return fsService.readFile(payload.relativePath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_WRITE_FILE,
    async (_e: unknown, payload: { relativePath: string; content: string }) => {
      return fsService.writeFile(payload.relativePath, payload.content);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_DELETE_ITEM,
    async (_e: unknown, payload: { relativePath: string }) => {
      return fsService.deleteItem(payload.relativePath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_RENAME_ITEM,
    async (_e: unknown, payload: { oldRelativePath: string; newRelativePath: string }) => {
      return fsService.renameItem(payload.oldRelativePath, payload.newRelativePath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_COPY_ASSET,
    async (_e: unknown, payload: { sourceAbsolutePath: string; preferredFileName?: string }) => {
      return fsService.copyMediaToAssets(payload.sourceAbsolutePath, payload.preferredFileName);
    }
  );

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_PICK_AND_COPY_ASSET, async () => {
    const res = await dialog.showOpenDialog({
      title: 'Select Image or Media Asset to Copy into Workspace /assets/',
      properties: ['openFile'],
      filters: [
        { name: 'Images & Media', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }
      ]
    });
    if (res.canceled || !res.filePaths?.[0]) {
      return null;
    }
    return fsService.copyMediaToAssets(res.filePaths[0]);
  });

  ipcMain.handle(
    IPC_CHANNELS.WORKSPACE_SEARCH_FILES,
    async (_e: unknown, payload: { query: string; maxResults?: number }) => {
      return fsService.searchWorkspaceFiles(payload.query, payload.maxResults);
    }
  );

  // ==========================================================================
  // SQLite Database Handlers (Strictly .db / .sqlite via better-sqlite3)
  // ==========================================================================
  const resolveDb = (relativeOrAbsPath: string): string => {
    if (path.isAbsolute(relativeOrAbsPath)) return relativeOrAbsPath;
    return fsService.resolveSafePath(relativeOrAbsPath);
  };

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_LIST_TABLES,
    async (_e: unknown, payload: { dbPath: string }) => {
      return sqliteService.listTables(resolveDb(payload.dbPath));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_GET_TABLE_SCHEMA,
    async (_e: unknown, payload: { dbPath: string; tableName: string }) => {
      return sqliteService.getTableSchema(resolveDb(payload.dbPath), payload.tableName);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_CREATE_TABLE,
    async (
      _e: unknown,
      payload: {
        dbPath: string;
        tableName: string;
        columns: Array<{
          name: string;
          type: SqliteColumnAffinity;
          notnull?: boolean;
          defaultValue?: string;
        }>;
      }
    ) => {
      return sqliteService.createTable(
        resolveDb(payload.dbPath),
        payload.tableName,
        payload.columns
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_DROP_TABLE,
    async (_e: unknown, payload: { dbPath: string; tableName: string }) => {
      return sqliteService.dropTable(resolveDb(payload.dbPath), payload.tableName);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_ADD_COLUMN,
    async (
      _e: unknown,
      payload: {
        dbPath: string;
        tableName: string;
        columnName: string;
        columnType: SqliteColumnAffinity;
        defaultValue?: string;
      }
    ) => {
      return sqliteService.addColumn(
        resolveDb(payload.dbPath),
        payload.tableName,
        payload.columnName,
        payload.columnType,
        payload.defaultValue
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_RENAME_COLUMN,
    async (
      _e: unknown,
      payload: {
        dbPath: string;
        tableName: string;
        oldColumnName: string;
        newColumnName: string;
      }
    ) => {
      return sqliteService.renameColumn(
        resolveDb(payload.dbPath),
        payload.tableName,
        payload.oldColumnName,
        payload.newColumnName
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_DROP_COLUMN,
    async (_e: unknown, payload: { dbPath: string; tableName: string; columnName: string }) => {
      return sqliteService.dropColumn(
        resolveDb(payload.dbPath),
        payload.tableName,
        payload.columnName
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_QUERY_TABLE_ROWS,
    async (_e: unknown, payload: SqliteTableQueryRequest) => {
      return sqliteService.queryTableRows({
        ...payload,
        dbPath: resolveDb(payload.dbPath)
      });
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_INSERT_ROW,
    async (
      _e: unknown,
      payload: { dbPath: string; tableName: string; values: Record<string, unknown> }
    ) => {
      return sqliteService.insertRow(
        resolveDb(payload.dbPath),
        payload.tableName,
        payload.values
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_UPDATE_CELL,
    async (
      _e: unknown,
      payload: {
        dbPath: string;
        tableName: string;
        rowId: number | string;
        columnName: string;
        newValue: unknown;
        pkColumn?: string;
      }
    ) => {
      return sqliteService.updateCell(
        resolveDb(payload.dbPath),
        payload.tableName,
        payload.rowId,
        payload.columnName,
        payload.newValue,
        payload.pkColumn
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_DELETE_ROWS,
    async (
      _e: unknown,
      payload: {
        dbPath: string;
        tableName: string;
        rowIds: Array<number | string>;
        pkColumn?: string;
      }
    ) => {
      return sqliteService.deleteRows(
        resolveDb(payload.dbPath),
        payload.tableName,
        payload.rowIds,
        payload.pkColumn
      );
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SQLITE_EXECUTE_RAW,
    async (_e: unknown, payload: { dbPath: string; sql: string }) => {
      return sqliteService.executeRawSql(resolveDb(payload.dbPath), payload.sql);
    }
  );

  // ==========================================================================
  // Native PDF Export Handlers (`webContents.printToPDF`)
  // ==========================================================================
  ipcMain.handle(
    IPC_CHANNELS.PDF_EXPORT_DOCUMENT,
    async (_e: unknown, payload: PdfDocumentExportPayload) => {
      return pdfService.exportToPdf(payload);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PDF_EXPORT_TABLE,
    async (_e: unknown, payload: PdfTableExportPayload) => {
      return pdfService.exportToPdf(payload);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PDF_EXPORT_DECK,
    async (_e: unknown, payload: PdfDeckExportPayload) => {
      return pdfService.exportToPdf(payload);
    }
  );
}
