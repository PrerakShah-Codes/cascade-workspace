import * as path from 'path';
import * as os from 'os';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { FsService } from './services/fs-service';
import { SqliteService } from './services/sqlite-service';
import { PdfService } from './services/pdf-service';
import { registerIpcHandlers } from './ipc-router';

let mainWindow: BrowserWindow | null = null;

const defaultWorkspaceDir = path.join(os.homedir(), 'CascadeWorkspace');
const fsService = new FsService(defaultWorkspaceDir);
const sqliteService = new SqliteService();
const pdfService = new PdfService(defaultWorkspaceDir);

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1080,
    minHeight: 680,
    backgroundColor: '#161616',
    title: 'Cascade Workspace',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // Required for preload bridge with better-sqlite3 IPC
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  await fsService.ensureWorkspaceStructure();
  registerIpcHandlers(ipcMain, dialog, {
    fsService,
    sqliteService,
    pdfService
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  sqliteService.closeAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
