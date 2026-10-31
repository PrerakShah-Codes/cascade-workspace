import React, { useState, useEffect, useMemo } from 'react';
import {
  SqliteColumnAffinity,
  SqliteFilterRule,
  SqliteRawExecutionResult,
  SqliteTableSummary
} from '../../../../shared/types';
import { useWorkspaceStore } from '../../store/workspace-store';
import { VisualDataGrid } from './VisualDataGrid';
import { SqlQueryEditor } from './SqlQueryEditor';

interface SqliteWorkspaceProps {
  relativePath: string;
}

/**
 * Full SQLite Database Workspace (`.db` / `.sqlite`).
 * Strictly native SQLite only (no CSV import/export).
 */
export const SqliteWorkspace: React.FC<SqliteWorkspaceProps> = ({
  relativePath
}) => {
  const {
    inMemoryDbs,
    setInMemoryDbs,
    settings,
    setPdfExportModalState,
    setStatusMessage
  } = useWorkspaceStore();

  const dbEntry = inMemoryDbs[relativePath] ||
    inMemoryDbs['databases/engineering-metrics.db'];

  const tableNames = Object.keys(dbEntry?.tables || {});
  const [activeTableName, setActiveTableName] = useState<string>(
    tableNames[0] || 'benchmark_runs'
  );
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number | string>>(
    new Set()
  );
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [filterRule, setFilterRule] = useState<SqliteFilterRule | null>(null);
  const [newTableName, setNewTableName] = useState<string>('');

  useEffect(() => {
    if (tableNames.length > 0 && !tableNames.includes(activeTableName)) {
      setActiveTableName(tableNames[0]);
    }
  }, [tableNames, activeTableName]);

  const activeTable = dbEntry?.tables[activeTableName];
  const columns = activeTable?.summary.columns || [];
  const rawRows = activeTable?.rows || [];

  const filteredAndSortedRows = useMemo(() => {
    let list = [...rawRows];
    if (filterRule && filterRule.value.trim()) {
      const q = filterRule.value.toLowerCase();
      list = list.filter((r) => {
        const cell = String(r[filterRule.column] ?? '').toLowerCase();
        if (filterRule.operator === 'contains') return cell.includes(q);
        if (filterRule.operator === 'equals') return cell === q;
        if (filterRule.operator === 'starts_with') return cell.startsWith(q);
        if (filterRule.operator === 'gt')
          return Number(r[filterRule.column]) > Number(filterRule.value);
        if (filterRule.operator === 'lt')
          return Number(r[filterRule.column]) < Number(filterRule.value);
        return true;
      });
    }

    list.sort((a, b) => {
      const av = a[sortColumn];
      const bv = b[sortColumn];
      if (av === bv) return 0;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDirection === 'ASC' ? cmp : -cmp;
    });

    return list;
  }, [rawRows, filterRule, sortColumn, sortDirection]);

  const updateTableState = (
    updater: (table: {
      summary: SqliteTableSummary;
      rows: Record<string, unknown>[];
    }) => {
      summary: SqliteTableSummary;
      rows: Record<string, unknown>[];
    }
  ): void => {
    setInMemoryDbs((prev) => {
      const targetKey = prev[relativePath]
        ? relativePath
        : 'databases/engineering-metrics.db';
      const currentDb = prev[targetKey];
      if (!currentDb || !currentDb.tables[activeTableName]) return prev;
      return {
        ...prev,
        [targetKey]: {
          ...currentDb,
          tables: {
            ...currentDb.tables,
            [activeTableName]: updater(currentDb.tables[activeTableName])
          }
        }
      };
    });
  };

  const handleCreateNewTable = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const clean = newTableName.trim().replace(/[^a-zA-Z0-9_]/g, '_');
    if (!clean) return;

    if (window.cascadeAPI) {
      await window.cascadeAPI.sqlite.createTable(relativePath, clean, [
        { name: 'name', type: 'TEXT', notnull: true },
        { name: 'value', type: 'REAL' }
      ]);
    }

    setInMemoryDbs((prev) => {
      const targetKey = prev[relativePath]
        ? relativePath
        : 'databases/engineering-metrics.db';
      const currentDb = prev[targetKey];
      return {
        ...prev,
        [targetKey]: {
          tables: {
            ...currentDb.tables,
            [clean]: {
              summary: {
                name: clean,
                rowCount: 1,
                createSql: `CREATE TABLE "${clean}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "value" REAL)`,
                columns: [
                  { cid: 0, name: 'id', type: 'INTEGER', notnull: true, defaultValue: null, pk: true },
                  { cid: 1, name: 'name', type: 'TEXT', notnull: true, defaultValue: null, pk: false },
                  { cid: 2, name: 'value', type: 'REAL', notnull: false, defaultValue: '0.0', pk: false }
                ]
              },
              rows: [{ _rowid_: 1, id: 1, name: 'Sample Row', value: 42.5 }]
            }
          }
        }
      };
    });

    setActiveTableName(clean);
    setNewTableName('');
    setStatusMessage(`Created SQLite table "${clean}" in ${relativePath}`);
  };

  const handleInsertRow = async (values: Record<string, unknown>): Promise<void> => {
    if (window.cascadeAPI) {
      await window.cascadeAPI.sqlite.insertRow(relativePath, activeTableName, values);
    }
    updateTableState((tbl) => {
      const nextId = tbl.rows.length + 1;
      const newRow = { _rowid_: nextId, id: nextId, ...values };
      return {
        summary: { ...tbl.summary, rowCount: tbl.rows.length + 1 },
        rows: [...tbl.rows, newRow]
      };
    });
    setStatusMessage(`Inserted row into ${activeTableName}`);
  };

  const handleUpdateCell = async (
    rowId: number | string,
    colName: string,
    value: unknown
  ): Promise<void> => {
    if (window.cascadeAPI) {
      await window.cascadeAPI.sqlite.updateCell(
        relativePath,
        activeTableName,
        rowId,
        colName,
        value
      );
    }
    updateTableState((tbl) => ({
      ...tbl,
      rows: tbl.rows.map((r) =>
        (r._rowid_ ?? r.id) === rowId ? { ...r, [colName]: value } : r
      )
    }));
    setStatusMessage(`Updated ${activeTableName}.${colName} (row ${rowId})`);
  };

  const handleDeleteSelectedRows = async (): Promise<void> => {
    const ids = Array.from(selectedRowIds);
    if (ids.length === 0) return;
    if (window.cascadeAPI) {
      await window.cascadeAPI.sqlite.deleteRows(relativePath, activeTableName, ids);
    }
    updateTableState((tbl) => {
      const remaining = tbl.rows.filter(
        (r) => !selectedRowIds.has((r._rowid_ ?? r.id) as number | string)
      );
      return {
        summary: { ...tbl.summary, rowCount: remaining.length },
        rows: remaining
      };
    });
    setSelectedRowIds(new Set());
    setStatusMessage(`Deleted ${ids.length} row(s) from ${activeTableName}`);
  };

  const handleAddColumn = async (
    colName: string,
    colType: SqliteColumnAffinity,
    defaultVal?: string
  ): Promise<void> => {
    if (window.cascadeAPI) {
      await window.cascadeAPI.sqlite.addColumn(
        relativePath,
        activeTableName,
        colName,
        colType,
        defaultVal
      );
    }
    updateTableState((tbl) => ({
      summary: {
        ...tbl.summary,
        columns: [
          ...tbl.summary.columns,
          {
            cid: tbl.summary.columns.length,
            name: colName,
            type: colType,
            notnull: false,
            defaultValue: defaultVal ?? null,
            pk: false
          }
        ]
      },
      rows: tbl.rows.map((r) => ({ ...r, [colName]: defaultVal ?? null }))
    }));
    setStatusMessage(`Added column "${colName}" (${colType}) to ${activeTableName}`);
  };

  const handleRenameColumn = async (
    oldName: string,
    newName: string
  ): Promise<void> => {
    if (window.cascadeAPI) {
      await window.cascadeAPI.sqlite.renameColumn(
        relativePath,
        activeTableName,
        oldName,
        newName
      );
    }
    updateTableState((tbl) => ({
      summary: {
        ...tbl.summary,
        columns: tbl.summary.columns.map((c) =>
          c.name === oldName ? { ...c, name: newName } : c
        )
      },
      rows: tbl.rows.map((r) => {
        const copy = { ...r, [newName]: r[oldName] };
        delete copy[oldName];
        return copy;
      })
    }));
    setStatusMessage(`Renamed column "${oldName}" → "${newName}"`);
  };

  const handleDropColumn = async (colName: string): Promise<void> => {
    if (window.cascadeAPI) {
      await window.cascadeAPI.sqlite.dropColumn(
        relativePath,
        activeTableName,
        colName
      );
    }
    updateTableState((tbl) => ({
      summary: {
        ...tbl.summary,
        columns: tbl.summary.columns.filter((c) => c.name !== colName)
      },
      rows: tbl.rows.map((r) => {
        const copy = { ...r };
        delete copy[colName];
        return copy;
      })
    }));
    setStatusMessage(`Dropped column "${colName}" from ${activeTableName}`);
  };

  const handleExecuteRawSql = async (
    sql: string
  ): Promise<SqliteRawExecutionResult> => {
    if (window.cascadeAPI) {
      return window.cascadeAPI.sqlite.executeRaw(relativePath, sql);
    }

    const start = Date.now();
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith('SELECT')) {
      const cols = columns.map((c) => c.name);
      return {
        statementType: 'SELECT',
        columns: cols,
        rows: filteredAndSortedRows,
        executionTimeMs: Date.now() - start + 1,
        message: `Returned ${filteredAndSortedRows.length} row(s) from ${activeTableName} in 1 ms.`
      };
    }

    return {
      statementType: 'MUTATION',
      columns: ['changes', 'status'],
      rows: [{ changes: 1, status: 'COMMITTED (WAL)' }],
      changes: 1,
      executionTimeMs: 1,
      message: `Executed statement on ${relativePath} in 1 ms.`
    };
  };

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E]">
      {/* Top Database Header Bar */}
      <div className="px-4 py-2 bg-[#161616] border-b border-[#2D2D2D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574]">
            SQLite3 • WAL
          </span>
          <h2 className="text-sm font-bold text-[#E6E6E6]">{relativePath}</h2>
          <span className="text-xs text-[#9E9E9E]">
            ({tableNames.length} tables • Strictly native `.db`/`.sqlite`)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setPdfExportModalState({
                open: true,
                mode: 'table',
                customTitle: `${relativePath.split('/').pop()} — ${activeTableName}`
              })
            }
            className="px-3 py-1 text-xs font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] transition-colors"
          >
            Export Table / Selection to PDF
          </button>
        </div>
      </div>

      {/* Main Content: Left Table Selector + Right Visual Grid & SQL Console */}
      <div className="flex-1 flex min-h-0">
        {/* Table List Sidebar */}
        <div className="w-52 bg-[#161616] border-r border-[#2D2D2D] p-2.5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] px-2 mb-1.5">
              Database Tables
            </div>
            {tableNames.map((tName) => {
              const count = dbEntry?.tables[tName]?.rows.length ?? 0;
              const isSelected = tName === activeTableName;
              return (
                <button
                  key={tName}
                  type="button"
                  onClick={() => {
                    setActiveTableName(tName);
                    setSelectedRowIds(new Set());
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                    isSelected
                      ? 'bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]'
                      : 'text-[#9E9E9E] hover:text-[#E6E6E6] hover:bg-[#1E1E1E]'
                  }`}
                >
                  <span className="truncate">{tName}</span>
                  <span className="text-[10px] px-1.5 rounded bg-[#161616] text-[#7E42C1]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleCreateNewTable}
            className="pt-2 border-t border-[#2D2D2D] space-y-1.5"
          >
            <div className="text-[11px] text-[#9E9E9E]">Create New Table</div>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="new_table_name"
              className="w-full px-2 py-1 text-xs rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#4A2574] text-[#E6E6E6] font-mono focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-1 text-xs font-semibold rounded bg-[#2A1B3D] hover:bg-[#4A2574] text-[#E6E6E6] border border-[#4A2574]"
            >
              + Create Table
            </button>
          </form>
        </div>

        {/* Visual Grid + Raw SQL Query Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <VisualDataGrid
            tableName={activeTableName}
            columns={columns}
            rows={filteredAndSortedRows}
            selectedRowIds={selectedRowIds}
            onToggleSelectRow={(rowId) => {
              setSelectedRowIds((prev) => {
                const next = new Set(prev);
                if (next.has(rowId)) next.delete(rowId);
                else next.add(rowId);
                return next;
              });
            }}
            onToggleSelectAll={() => {
              if (selectedRowIds.size === filteredAndSortedRows.length) {
                setSelectedRowIds(new Set());
              } else {
                setSelectedRowIds(
                  new Set(
                    filteredAndSortedRows.map(
                      (r, idx) => (r._rowid_ ?? r.id ?? idx + 1) as number | string
                    )
                  )
                );
              }
            }}
            onInsertRow={handleInsertRow}
            onUpdateCell={handleUpdateCell}
            onDeleteSelectedRows={handleDeleteSelectedRows}
            onAddColumn={handleAddColumn}
            onRenameColumn={handleRenameColumn}
            onDropColumn={handleDropColumn}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortChange={(col) => {
              if (sortColumn === col) {
                setSortDirection((d) => (d === 'ASC' ? 'DESC' : 'ASC'));
              } else {
                setSortColumn(col);
                setSortDirection('ASC');
              }
            }}
            filterRule={filterRule}
            onFilterChange={setFilterRule}
            nullLabel={settings.sqlite.nullDisplayLabel}
          />

          <SqlQueryEditor
            onExecuteSql={handleExecuteRawSql}
            onExportResultToPdf={(_res, sqlUsed) => {
              setPdfExportModalState({
                open: true,
                mode: 'table',
                customTitle: `Query Result (${sqlUsed.slice(0, 24)}...)`
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};
