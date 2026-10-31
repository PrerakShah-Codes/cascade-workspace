import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import {
  SqliteColumnAffinity,
  SqliteColumnInfo,
  SqliteFilterRule,
  SqliteRawExecutionResult,
  SqliteTableQueryRequest,
  SqliteTableQueryResult,
  SqliteTableSummary
} from '../../shared/types';

/**
 * Minimal synchronous database driver interface matching better-sqlite3.
 */
interface SyncSqliteDriver {
  exec(sql: string): void;
  queryAll(sql: string, params?: unknown[]): Record<string, unknown>[];
  runMutation(
    sql: string,
    params?: unknown[]
  ): { changes: number; lastInsertRowid: number | string };
  close(): void;
}

/**
 * Adapter for native `better-sqlite3` when compiled for the host Electron runtime.
 */
class BetterSqliteDriver implements SyncSqliteDriver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(DatabaseCtor: any, dbPath: string) {
    this.db = new DatabaseCtor(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  public exec(sql: string): void {
    this.db.exec(sql);
  }

  public queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as Record<string, unknown>[];
  }

  public runMutation(
    sql: string,
    params: unknown[] = []
  ): { changes: number; lastInsertRowid: number | string } {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      changes: Number(info.changes ?? 0),
      lastInsertRowid:
        typeof info.lastInsertRowid === 'bigint'
          ? Number(info.lastInsertRowid)
          : (info.lastInsertRowid ?? 0)
    };
  }

  public close(): void {
    this.db.close();
  }
}

/**
 * Adapter for Node.js built-in `node:sqlite` (`DatabaseSync`, available in Node 22.5+).
 */
class NodeBuiltinSqliteDriver implements SyncSqliteDriver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(DatabaseSyncCtor: any, dbPath: string) {
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSyncCtor(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  }

  public exec(sql: string): void {
    this.db.exec(sql);
  }

  public queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
    const stmt = this.db.prepare(sql);
    const rawRows = stmt.all(...params) as Record<string, unknown>[];
    return rawRows.map((r) => ({ ...r }));
  }

  public runMutation(
    sql: string,
    params: unknown[] = []
  ): { changes: number; lastInsertRowid: number | string } {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      changes: Number(info.changes ?? 0),
      lastInsertRowid:
        typeof info.lastInsertRowid === 'bigint'
          ? Number(info.lastInsertRowid)
          : Number(info.lastInsertRowid ?? 0)
    };
  }

  public close(): void {
    this.db.close();
  }
}

interface PythonCommandSpec {
  bin: string;
  prefixArgs: string[];
}

let cachedPythonCmd: PythonCommandSpec | null = null;

function resolvePythonCommand(): PythonCommandSpec {
  if (cachedPythonCmd) {
    return cachedPythonCmd;
  }

  const candidates: PythonCommandSpec[] =
    process.platform === 'win32'
      ? [
          { bin: 'python', prefixArgs: [] },
          { bin: 'py', prefixArgs: ['-3'] },
          { bin: 'py', prefixArgs: [] },
          { bin: 'python3', prefixArgs: [] }
        ]
      : [
          { bin: 'python3', prefixArgs: [] },
          { bin: 'python', prefixArgs: [] }
        ];

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const searchRoots = [
      path.join(localAppData, 'Programs', 'Python'),
      programFiles
    ];
    for (const root of searchRoots) {
      if (root && fs.existsSync(root)) {
        try {
          for (const entry of fs.readdirSync(root)) {
            if (entry.toLowerCase().startsWith('python')) {
              const exePath = path.join(root, entry, 'python.exe');
              if (fs.existsSync(exePath)) {
                candidates.push({ bin: exePath, prefixArgs: [] });
              }
            }
          }
        } catch {
          // Ignore unreadable directories
        }
      }
    }
  }

  for (const cand of candidates) {
    try {
      const out = execFileSync(
        cand.bin,
        [...cand.prefixArgs, '-c', 'import sqlite3; print("CASCADE_PY_OK")'],
        {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true
        }
      );
      if (out && out.includes('CASCADE_PY_OK')) {
        cachedPythonCmd = cand;
        return cand;
      }
    } catch {
      // Try next Python launcher candidate (skips Windows Store 9009 stub alias)
    }
  }

  throw new Error(
    'No working SQLite driver found (tried better-sqlite3, node:sqlite, python, py -3, and python3).'
  );
}

/**
 * Fallback synchronous SQLite driver backed by system Python `sqlite3` stdlib module.
 * Automatically resolves `python`, `py -3`, or `python3` across Windows, macOS, and Linux,
 * bypassing the Windows Store `python3.exe` execution alias stub.
 */
class NativeSqliteBridgeDriver implements SyncSqliteDriver {
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = path.resolve(dbPath);
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private invokePython(payload: {
    mode: 'exec' | 'all' | 'run';
    sql: string;
    params?: unknown[];
  }): {
    rows?: Record<string, unknown>[];
    changes?: number;
    lastInsertRowid?: number;
    error?: string;
  } {
    const script = `
import sys, json, sqlite3

req = json.loads(sys.stdin.read())
db_path = req["dbPath"]
mode = req["mode"]
sql = req["sql"]
params = req.get("params") or []

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
try:
    cur = conn.cursor()
    if mode == "exec":
        cur.executescript(sql)
        conn.commit()
        print(json.dumps({"changes": conn.total_changes, "lastInsertRowid": cur.lastrowid or 0}))
    elif mode == "all":
        cur.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        conn.commit()
        print(json.dumps({"rows": rows}))
    elif mode == "run":
        cur.execute(sql, params)
        conn.commit()
        print(json.dumps({"changes": cur.rowcount if cur.rowcount >= 0 else 0, "lastInsertRowid": cur.lastrowid or 0}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
finally:
    conn.close()
`;
    const inputJson = JSON.stringify({
      dbPath: this.dbPath,
      mode: payload.mode,
      sql: payload.sql,
      params: payload.params ?? []
    });

    const pyCmd = resolvePythonCommand();
    const stdout = execFileSync(pyCmd.bin, [...pyCmd.prefixArgs, '-c', script], {
      input: inputJson,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
    const parsed = JSON.parse(stdout.trim());
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed;
  }

  public exec(sql: string): void {
    this.invokePython({ mode: 'exec', sql });
  }

  public queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
    const res = this.invokePython({ mode: 'all', sql, params });
    return res.rows ?? [];
  }

  public runMutation(
    sql: string,
    params: unknown[] = []
  ): { changes: number; lastInsertRowid: number | string } {
    const res = this.invokePython({ mode: 'run', sql, params });
    return {
      changes: res.changes ?? 0,
      lastInsertRowid: res.lastInsertRowid ?? 0
    };
  }

  public close(): void {
    // Connection is closed per atomic operation
  }
}

/**
 * SQLite Database Service for Cascade Workspace.
 * Strictly manages `.db` and `.sqlite` files (no CSV import/export).
 */
export class SqliteService {
  private pool: Map<string, SyncSqliteDriver> = new Map();

  private getDriver(dbPath: string): SyncSqliteDriver {
    const resolved = path.resolve(dbPath);
    const ext = path.extname(resolved).toLowerCase();
    if (!['.db', '.sqlite', '.sqlite3'].includes(ext)) {
      throw new Error(
        `Unsupported database file "${path.basename(resolved)}". Strictly .db and .sqlite files are supported.`
      );
    }

    const existing = this.pool.get(resolved);
    if (existing) return existing;

    let driver: SyncSqliteDriver;
    try {
      // 1. Attempt native better-sqlite3 first
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const BetterSqlite3 = require('better-sqlite3');
      driver = new BetterSqliteDriver(BetterSqlite3, resolved);
    } catch {
      try {
        // 2. Attempt Node.js built-in node:sqlite (Node 22.5+)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { DatabaseSync } = require('node:sqlite');
        driver = new NodeBuiltinSqliteDriver(DatabaseSync, resolved);
      } catch {
        // 3. Fallback to Python sqlite3 bridge (probes python, py -3, python3)
        driver = new NativeSqliteBridgeDriver(resolved);
      }
    }

    this.pool.set(resolved, driver);
    return driver;
  }

  public closeAll(): void {
    for (const drv of this.pool.values()) {
      drv.close();
    }
    this.pool.clear();
  }

  private assertSafeIdentifier(identifier: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error(
        `Invalid SQLite identifier "${identifier}". Use alphanumeric characters and underscores.`
      );
    }
    return `"${identifier}"`;
  }

  /**
   * Lists all user tables in a `.db` / `.sqlite` file along with column schemas and row counts.
   */
  public listTables(dbPath: string): SqliteTableSummary[] {
    const drv = this.getDriver(dbPath);
    const tables = drv.queryAll(
      `SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC`
    );

    return tables.map((t) => {
      const tableName = String(t.name);
      const columns = this.getTableSchema(dbPath, tableName);
      const countRow = drv.queryAll(
        `SELECT COUNT(*) as total FROM ${this.assertSafeIdentifier(tableName)}`
      );
      const rowCount = Number(countRow[0]?.total ?? 0);

      return {
        name: tableName,
        rowCount,
        columns,
        createSql: String(t.sql ?? '')
      };
    });
  }

  /**
   * Returns column metadata for a given table via PRAGMA table_info.
   */
  public getTableSchema(dbPath: string, tableName: string): SqliteColumnInfo[] {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    const rows = drv.queryAll(`PRAGMA table_info(${safeTable})`);
    return rows.map((r) => ({
      cid: Number(r.cid),
      name: String(r.name),
      type: String(r.type || 'TEXT'),
      notnull: Boolean(r.notnull),
      defaultValue: r.dflt_value !== null && r.dflt_value !== undefined ? String(r.dflt_value) : null,
      pk: Number(r.pk) > 0
    }));
  }

  /**
   * Creates a new table with an automatic `id INTEGER PRIMARY KEY AUTOINCREMENT` and custom columns.
   */
  public createTable(
    dbPath: string,
    tableName: string,
    columns: Array<{
      name: string;
      type: SqliteColumnAffinity;
      notnull?: boolean;
      defaultValue?: string;
    }>
  ): SqliteTableSummary {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);

    const colDefs: string[] = ['"id" INTEGER PRIMARY KEY AUTOINCREMENT'];
    for (const col of columns) {
      if (col.name.toLowerCase() === 'id') continue;
      const safeCol = this.assertSafeIdentifier(col.name);
      let def = `${safeCol} ${col.type}`;
      if (col.notnull) def += ' NOT NULL';
      if (col.defaultValue !== undefined && col.defaultValue !== '') {
        def += ` DEFAULT '${String(col.defaultValue).replace(/'/g, "''")}'`;
      }
      colDefs.push(def);
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${safeTable} (${colDefs.join(', ')});`;
    drv.exec(sql);

    const allTables = this.listTables(dbPath);
    const created = allTables.find((t) => t.name === tableName);
    if (!created) {
      throw new Error(`Failed to verify created table "${tableName}".`);
    }
    return created;
  }

  public dropTable(dbPath: string, tableName: string): boolean {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    drv.exec(`DROP TABLE IF EXISTS ${safeTable};`);
    return true;
  }

  /**
   * Adds a new column to an existing SQLite table.
   */
  public addColumn(
    dbPath: string,
    tableName: string,
    columnName: string,
    columnType: SqliteColumnAffinity = 'TEXT',
    defaultValue?: string
  ): SqliteColumnInfo[] {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    const safeCol = this.assertSafeIdentifier(columnName);

    let sql = `ALTER TABLE ${safeTable} ADD COLUMN ${safeCol} ${columnType}`;
    if (defaultValue !== undefined && defaultValue !== '') {
      sql += ` DEFAULT '${String(defaultValue).replace(/'/g, "''")}'`;
    }
    drv.exec(sql);
    return this.getTableSchema(dbPath, tableName);
  }

  /**
   * Renames an existing column in an SQLite table.
   */
  public renameColumn(
    dbPath: string,
    tableName: string,
    oldColumnName: string,
    newColumnName: string
  ): SqliteColumnInfo[] {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    const safeOld = this.assertSafeIdentifier(oldColumnName);
    const safeNew = this.assertSafeIdentifier(newColumnName);

    drv.exec(`ALTER TABLE ${safeTable} RENAME COLUMN ${safeOld} TO ${safeNew};`);
    return this.getTableSchema(dbPath, tableName);
  }

  /**
   * Drops a non-primary-key column from an SQLite table.
   */
  public dropColumn(
    dbPath: string,
    tableName: string,
    columnName: string
  ): SqliteColumnInfo[] {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    const safeCol = this.assertSafeIdentifier(columnName);

    drv.exec(`ALTER TABLE ${safeTable} DROP COLUMN ${safeCol};`);
    return this.getTableSchema(dbPath, tableName);
  }

  /**
   * Queries rows from a table with visual filters, sorting, and pagination.
   * Always includes `_rowid_` so rows can be edited/deleted reliably even without an explicit PK.
   */
  public queryTableRows(request: SqliteTableQueryRequest): SqliteTableQueryResult {
    const startTime = Date.now();
    const drv = this.getDriver(request.dbPath);
    const safeTable = this.assertSafeIdentifier(request.tableName);
    const columns = this.getTableSchema(request.dbPath, request.tableName);

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (request.filters && request.filters.length > 0) {
      for (const filter of request.filters) {
        const safeCol = this.assertSafeIdentifier(filter.column);
        switch (filter.operator) {
          case 'contains':
            whereClauses.push(`CAST(${safeCol} AS TEXT) LIKE ?`);
            params.push(`%${filter.value}%`);
            break;
          case 'starts_with':
            whereClauses.push(`CAST(${safeCol} AS TEXT) LIKE ?`);
            params.push(`${filter.value}%`);
            break;
          case 'equals':
            whereClauses.push(`CAST(${safeCol} AS TEXT) = ?`);
            params.push(filter.value);
            break;
          case 'gt':
            whereClauses.push(`${safeCol} > ?`);
            params.push(Number.isNaN(Number(filter.value)) ? filter.value : Number(filter.value));
            break;
          case 'lt':
            whereClauses.push(`${safeCol} < ?`);
            params.push(Number.isNaN(Number(filter.value)) ? filter.value : Number(filter.value));
            break;
          case 'is_null':
            whereClauses.push(`${safeCol} IS NULL`);
            break;
          case 'not_null':
            whereClauses.push(`${safeCol} IS NOT NULL`);
            break;
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderSql = '';
    if (request.sortColumn) {
      const safeSortCol = this.assertSafeIdentifier(request.sortColumn);
      const dir = request.sortDirection === 'DESC' ? 'DESC' : 'ASC';
      orderSql = `ORDER BY ${safeSortCol} ${dir}`;
    }

    const limit = request.limit ?? 200;
    const offset = request.offset ?? 0;

    const countRows = drv.queryAll(
      `SELECT COUNT(*) as total FROM ${safeTable} ${whereSql}`,
      params
    );
    const totalRowCount = Number(countRows[0]?.total ?? 0);

    const dataSql = `SELECT rowid AS _rowid_, * FROM ${safeTable} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
    const rows = drv.queryAll(dataSql, [...params, limit, offset]);

    return {
      tableName: request.tableName,
      columns,
      rows,
      totalRowCount,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Inserts a new row into a table.
   */
  public insertRow(
    dbPath: string,
    tableName: string,
    values: Record<string, unknown>
  ): { lastInsertRowid: number | string; changes: number } {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    const entries = Object.entries(values).filter(([, val]) => val !== undefined);

    if (entries.length === 0) {
      return drv.runMutation(`INSERT INTO ${safeTable} DEFAULT VALUES`);
    }

    const colNames = entries.map(([k]) => this.assertSafeIdentifier(k)).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const params = entries.map(([, v]) => v);

    return drv.runMutation(
      `INSERT INTO ${safeTable} (${colNames}) VALUES (${placeholders})`,
      params
    );
  }

  /**
   * Updates a single cell value inline identified by `_rowid_` or primary key.
   */
  public updateCell(
    dbPath: string,
    tableName: string,
    rowId: number | string,
    columnName: string,
    newValue: unknown,
    pkColumn = 'rowid'
  ): { changes: number } {
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    const safeCol = this.assertSafeIdentifier(columnName);
    const safePk = pkColumn === 'rowid' ? 'rowid' : this.assertSafeIdentifier(pkColumn);

    const res = drv.runMutation(
      `UPDATE ${safeTable} SET ${safeCol} = ? WHERE ${safePk} = ?`,
      [newValue, rowId]
    );
    return { changes: res.changes };
  }

  /**
   * Deletes one or more rows by their `_rowid_` or primary key values.
   */
  public deleteRows(
    dbPath: string,
    tableName: string,
    rowIds: Array<number | string>,
    pkColumn = 'rowid'
  ): { changes: number } {
    if (rowIds.length === 0) return { changes: 0 };
    const drv = this.getDriver(dbPath);
    const safeTable = this.assertSafeIdentifier(tableName);
    const safePk = pkColumn === 'rowid' ? 'rowid' : this.assertSafeIdentifier(pkColumn);
    const placeholders = rowIds.map(() => '?').join(', ');

    const res = drv.runMutation(
      `DELETE FROM ${safeTable} WHERE ${safePk} IN (${placeholders})`,
      rowIds
    );
    return { changes: res.changes };
  }

  /**
   * Executes custom raw SQL queries (`SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`, `JOIN`, etc.)
   * and returns structured tabular results or mutation execution logs.
   */
  public executeRawSql(dbPath: string, sql: string): SqliteRawExecutionResult {
    const startTime = Date.now();
    const trimmed = sql.trim();
    if (!trimmed) {
      return {
        statementType: 'ERROR',
        columns: [],
        rows: [],
        executionTimeMs: 0,
        message: 'SQL query cannot be empty.',
        error: 'Empty SQL statement'
      };
    }

    const drv = this.getDriver(dbPath);
    const upper = trimmed.replace(/^--.*$/gm, '').trim().toUpperCase();

    try {
      const isReadQuery =
        upper.startsWith('SELECT') ||
        upper.startsWith('PRAGMA') ||
        upper.startsWith('WITH') ||
        upper.startsWith('EXPLAIN');

      if (isReadQuery) {
        const rows = drv.queryAll(trimmed);
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        const elapsed = Date.now() - startTime;
        return {
          statementType: 'SELECT',
          columns,
          rows,
          executionTimeMs: elapsed,
          message: `Returned ${rows.length} row(s) in ${elapsed} ms.`
        };
      }

      const isDdl =
        upper.startsWith('CREATE') ||
        upper.startsWith('ALTER') ||
        upper.startsWith('DROP');

      if (isDdl) {
        drv.exec(trimmed);
        const elapsed = Date.now() - startTime;
        return {
          statementType: 'DDL',
          columns: [],
          rows: [],
          executionTimeMs: elapsed,
          message: `DDL statement executed cleanly in ${elapsed} ms.`
        };
      }

      const info = drv.runMutation(trimmed);
      const elapsed = Date.now() - startTime;
      return {
        statementType: 'MUTATION',
        columns: ['changes', 'lastInsertRowid'],
        rows: [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }],
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid,
        executionTimeMs: elapsed,
        message: `Affected ${info.changes} row(s) (lastInsertRowid: ${info.lastInsertRowid}) in ${elapsed} ms.`
      };
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        statementType: 'ERROR',
        columns: [],
        rows: [],
        executionTimeMs: elapsed,
        message: `SQL Error: ${errMsg}`,
        error: errMsg
      };
    }
  }
}
