import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import {
  DeckDocument,
  FileExtensionType,
  WorkspaceNode,
  WorkspaceSearchHit
} from '../../shared/types';

/**
 * Local-First File System & Asset Manager (`FsService`).
 * Enforces strict path traversal boundaries (`resolveSafePath`), automatic
 * `<workspace>/assets/` media copying with relative path returns, and full-text RAG search.
 */
export class FsService {
  private workspaceRoot: string;

  constructor(initialWorkspaceRoot: string) {
    this.workspaceRoot = path.resolve(initialWorkspaceRoot);
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  public async setWorkspaceRoot(newRoot: string): Promise<void> {
    this.workspaceRoot = path.resolve(newRoot);
    await this.ensureWorkspaceStructure();
  }

  /**
   * Ensures `<workspace>/notes`, `<workspace>/presentations`, `<workspace>/databases`,
   * and `<workspace>/assets` exist on disk.
   */
  public async ensureWorkspaceStructure(): Promise<void> {
    const dirs = [
      this.workspaceRoot,
      path.join(this.workspaceRoot, 'notes'),
      path.join(this.workspaceRoot, 'presentations'),
      path.join(this.workspaceRoot, 'databases'),
      path.join(this.workspaceRoot, 'assets')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Prevents directory traversal attacks (`../`) outside the active workspace directory.
   */
  public resolveSafePath(relativePath: string): string {
    const normalizedRel = relativePath.replace(/^[/\\]+/, '');
    const resolved = path.resolve(this.workspaceRoot, normalizedRel);
    const rootWithSep = this.workspaceRoot.endsWith(path.sep)
      ? this.workspaceRoot
      : `${this.workspaceRoot}${path.sep}`;

    if (resolved !== this.workspaceRoot && !resolved.startsWith(rootWithSep)) {
      throw new Error(
        `Security Violation: Path "${relativePath}" resolves outside the workspace root.`
      );
    }
    return resolved;
  }

  public static classifyExtension(filePath: string): FileExtensionType {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.md') return 'md';
    if (ext === '.deck') return 'deck';
    if (ext === '.db') return 'db';
    if (ext === '.sqlite' || ext === '.sqlite3') return 'sqlite';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
      return 'asset';
    }
    return 'other';
  }

  private toPosixRelative(absolutePath: string): string {
    return path
      .relative(this.workspaceRoot, absolutePath)
      .split(path.sep)
      .join('/');
  }

  public async getWorkspaceTree(subDir = ''): Promise<WorkspaceNode[]> {
    await this.ensureWorkspaceStructure();
    const targetDir = this.resolveSafePath(subDir);
    return this.readDirRecursive(targetDir);
  }

  private async readDirRecursive(dirAbsolutePath: string): Promise<WorkspaceNode[]> {
    const entries = await fs.readdir(dirAbsolutePath, { withFileTypes: true });
    const nodes: WorkspaceNode[] = [];

    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (entry.name.startsWith('.')) continue;

      const absPath = path.join(dirAbsolutePath, entry.name);
      const relPath = this.toPosixRelative(absPath);
      const stats = await fs.stat(absPath);

      if (entry.isDirectory()) {
        const children = await this.readDirRecursive(absPath);
        nodes.push({
          id: `dir:${relPath}`,
          name: entry.name,
          relativePath: relPath,
          absolutePath: absPath,
          isDirectory: true,
          updatedAt: stats.mtime.toISOString(),
          children
        });
      } else {
        nodes.push({
          id: `file:${relPath}`,
          name: entry.name,
          relativePath: relPath,
          absolutePath: absPath,
          isDirectory: false,
          extension: FsService.classifyExtension(entry.name),
          sizeBytes: stats.size,
          updatedAt: stats.mtime.toISOString()
        });
      }
    }

    return nodes;
  }

  public async createFile(
    relativePath: string,
    initialContent?: string
  ): Promise<WorkspaceNode> {
    const absPath = this.resolveSafePath(relativePath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });

    const ext = FsService.classifyExtension(absPath);
    let contentToWrite = initialContent ?? '';

    if (initialContent === undefined) {
      if (ext === 'md') {
        const title = path.basename(absPath, '.md');
        contentToWrite = `# ${title}\n\nWrite your local-first Markdown note here. Supports inline math $E = mc^2$, block KaTeX, Mermaid diagrams, and interactive function plots.\n`;
      } else if (ext === 'deck') {
        const title = path.basename(absPath, '.deck');
        const starterDeck = this.buildStarterDeck(title);
        contentToWrite = JSON.stringify(starterDeck, null, 2);
      }
    }

    if (ext === 'db' || ext === 'sqlite') {
      if (!fsSync.existsSync(absPath)) {
        await fs.writeFile(absPath, '');
      }
    } else {
      await fs.writeFile(absPath, contentToWrite, 'utf-8');
    }

    const stats = await fs.stat(absPath);
    const rel = this.toPosixRelative(absPath);
    return {
      id: `file:${rel}`,
      name: path.basename(absPath),
      relativePath: rel,
      absolutePath: absPath,
      isDirectory: false,
      extension: ext,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString()
    };
  }

  public async createFolder(relativePath: string): Promise<WorkspaceNode> {
    const absPath = this.resolveSafePath(relativePath);
    await fs.mkdir(absPath, { recursive: true });
    const stats = await fs.stat(absPath);
    const rel = this.toPosixRelative(absPath);
    return {
      id: `dir:${rel}`,
      name: path.basename(absPath),
      relativePath: rel,
      absolutePath: absPath,
      isDirectory: true,
      updatedAt: stats.mtime.toISOString(),
      children: []
    };
  }

  public async readFile(relativePath: string): Promise<string> {
    const absPath = this.resolveSafePath(relativePath);
    try {
      return await fs.readFile(absPath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return '';
      }
      throw err;
    }
  }

  public async writeFile(relativePath: string, content: string): Promise<void> {
    const absPath = this.resolveSafePath(relativePath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, content, 'utf-8');
  }

  public async deleteItem(relativePath: string): Promise<void> {
    const absPath = this.resolveSafePath(relativePath);
    if (absPath === this.workspaceRoot) {
      throw new Error('Cannot delete the workspace root directory.');
    }
    await fs.rm(absPath, { recursive: true, force: true });
  }

  public async renameItem(
    oldRelativePath: string,
    newRelativePath: string
  ): Promise<WorkspaceNode> {
    const oldAbs = this.resolveSafePath(oldRelativePath);
    const newAbs = this.resolveSafePath(newRelativePath);
    await fs.mkdir(path.dirname(newAbs), { recursive: true });
    await fs.rename(oldAbs, newAbs);

    const stats = await fs.stat(newAbs);
    const rel = this.toPosixRelative(newAbs);
    return {
      id: `${stats.isDirectory() ? 'dir' : 'file'}:${rel}`,
      name: path.basename(newAbs),
      relativePath: rel,
      absolutePath: newAbs,
      isDirectory: stats.isDirectory(),
      extension: stats.isDirectory()
        ? undefined
        : FsService.classifyExtension(newAbs),
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString()
    };
  }

  /**
   * Copies an external media file into `<workspace>/assets/` and returns its
   * relative workspace path (`assets/<filename>`).
   */
  public async copyMediaToAssets(
    sourceAbsolutePath: string,
    preferredFileName?: string
  ): Promise<{ relativePath: string; absolutePath: string; fileName: string }> {
    const assetsDir = this.resolveSafePath('assets');
    await fs.mkdir(assetsDir, { recursive: true });

    const originalBase = preferredFileName || path.basename(sourceAbsolutePath);
    const ext = path.extname(originalBase);
    const stem = path
      .basename(originalBase, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase();

    let candidateName = `${stem}${ext}`;
    let destAbsPath = path.join(assetsDir, candidateName);

    if (fsSync.existsSync(destAbsPath)) {
      candidateName = `${stem}-${Date.now()}${ext}`;
      destAbsPath = path.join(assetsDir, candidateName);
    }

    await fs.copyFile(sourceAbsolutePath, destAbsPath);
    const relPath = this.toPosixRelative(destAbsPath);

    return {
      relativePath: relPath,
      absolutePath: destAbsPath,
      fileName: candidateName
    };
  }

  public async copyExternalAssetToWorkspace(
    sourceAbsolutePath: string,
    preferredFileName?: string
  ): Promise<{ relativePath: string; absolutePath: string; fileName: string }> {
    return this.copyMediaToAssets(sourceAbsolutePath, preferredFileName);
  }

  public async searchWorkspaceFiles(
    query: string,
    maxResults = 15
  ): Promise<WorkspaceSearchHit[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const terms = trimmed.split(/\s+/).filter((t) => t.length >= 2);
    const searchTerms = terms.length > 0 ? terms : [trimmed];

    const tree = await this.getWorkspaceTree();
    const flatFiles: WorkspaceNode[] = [];

    const collect = (nodes: WorkspaceNode[]): void => {
      for (const n of nodes) {
        if (n.isDirectory && n.children) {
          collect(n.children);
        } else if (!n.isDirectory && (n.extension === 'md' || n.extension === 'deck')) {
          flatFiles.push(n);
        }
      }
    };
    collect(tree);

    const hits: WorkspaceSearchHit[] = [];

    for (const file of flatFiles) {
      if (hits.length >= maxResults) break;
      try {
        const raw = await fs.readFile(file.absolutePath, 'utf-8');
        const lines = raw.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
          const lineLower = lines[i].toLowerCase();
          const matchesAny = searchTerms.some((t) => lineLower.includes(t));
          if (matchesAny) {
            const start = Math.max(0, i - 2);
            const end = Math.min(lines.length, i + 3);
            hits.push({
              relativePath: file.relativePath,
              fileName: file.name,
              extension: file.extension || 'other',
              lineNumber: i + 1,
              snippet: lines[i].trim().slice(0, 180),
              fullContentExcerpt: lines.slice(start, end).join('\n').slice(0, 600)
            });
            break;
          }
        }
      } catch {
        // Ignore unreadable files
      }
    }

    return hits;
  }

  private buildStarterDeck(title: string): DeckDocument {
    const now = new Date().toISOString();
    return {
      schemaVersion: '1.0',
      title,
      author: '',
      createdAt: now,
      updatedAt: now,
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
          title: title,
          layout: 'title',
          background: 'linear-gradient(135deg, #1E1E1E 0%, #2A1B3D 100%)',
          borderAccentColor: '#4A2574',
          transition: { type: 'fade', durationMs: 400 },
          speakerNotes: 'Welcome to the presentation. Introduce key objectives.',
          elements: [
            {
              id: 'el-title-1',
              type: 'text',
              x: 80,
              y: 160,
              width: 800,
              height: 90,
              zIndex: 1,
              content: title,
              style: {
                fontSize: 44,
                fontWeight: 'bold',
                color: '#E6E6E6',
                textAlign: 'center'
              }
            },
            {
              id: 'el-sub-1',
              type: 'text',
              x: 120,
              y: 270,
              width: 720,
              height: 60,
              zIndex: 2,
              content: 'Local-First Presentation Studio • Cascade Workspace',
              style: {
                fontSize: 22,
                fontWeight: 'normal',
                color: '#9E9E9E',
                textAlign: 'center'
              }
            }
          ]
        }
      ]
    };
  }
}
