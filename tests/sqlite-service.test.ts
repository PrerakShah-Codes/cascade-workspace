import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SqliteService } from '../src/main/services/sqlite-service';

export async function runSqliteServiceTests(): Promise<void> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cascade-sqlite-test-'));
  const dbPath = path.join(tmpDir, 'telemetry.db');
  const service = new SqliteService();

  try {
    // 1. Reject non-SQLite extensions (e.g. .csv)
    assert.throws(
      () => service.listTables(path.join(tmpDir, 'forbidden.csv')),
      /Strictly \.db and \.sqlite files are supported/
    );

    // 2. Create a new table
    const summary = service.createTable(dbPath, 'experiments', [
      { name: 'title', type: 'TEXT', notnull: true },
      { name: 'score', type: 'REAL', defaultValue: '0.0' },
      { name: 'notes', type: 'TEXT' }
    ]);
    assert.strictEqual(summary.name, 'experiments');
    assert.strictEqual(summary.columns.length, 4); // id PK + 3 custom columns

    // 3. Add, Rename, and Drop column
    const afterAdd = service.addColumn(dbPath, 'experiments', 'temp_col', 'INTEGER', '1');
    assert.strictEqual(afterAdd.some((c) => c.name === 'temp_col'), true);

    const afterRename = service.renameColumn(
      dbPath,
      'experiments',
      'temp_col',
      'renamed_col'
    );
    assert.strictEqual(afterRename.some((c) => c.name === 'renamed_col'), true);

    const afterDrop = service.dropColumn(dbPath, 'experiments', 'renamed_col');
    assert.strictEqual(afterDrop.some((c) => c.name === 'renamed_col'), false);

    // 4. Insert rows and query with visual filter + sort
    service.insertRow(dbPath, 'experiments', {
      title: 'Alpha Harmonic',
      score: 91.5,
      notes: 'Baseline run'
    });
    service.insertRow(dbPath, 'experiments', {
      title: 'Beta Oscillator',
      score: 98.2,
      notes: 'Optimized run'
    });

    const queryRes = service.queryTableRows({
      dbPath,
      tableName: 'experiments',
      sortColumn: 'score',
      sortDirection: 'DESC',
      filters: [{ column: 'title', operator: 'contains', value: 'Beta' }]
    });
    assert.strictEqual(queryRes.totalRowCount, 1);
    assert.strictEqual(queryRes.rows[0].title, 'Beta Oscillator');

    // 5. Update cell inline and delete row
    const targetRowId = Number(queryRes.rows[0]._rowid_ ?? queryRes.rows[0].id);
    service.updateCell(dbPath, 'experiments', targetRowId, 'score', 99.9);

    const rawRes = service.executeRawSql(
      dbPath,
      'SELECT title, score FROM experiments WHERE score > 95;'
    );
    assert.strictEqual(rawRes.statementType, 'SELECT');
    assert.strictEqual(rawRes.rows.length, 1);
    assert.strictEqual(Number(rawRes.rows[0].score), 99.9);

    service.deleteRows(dbPath, 'experiments', [targetRowId]);
    const finalRows = service.queryTableRows({ dbPath, tableName: 'experiments' });
    assert.strictEqual(finalRows.totalRowCount, 1);

    console.log('✓ PASS: tests/sqlite-service.test.ts (all 6 assertions verified)');
  } finally {
    service.closeAll();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  runSqliteServiceTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
