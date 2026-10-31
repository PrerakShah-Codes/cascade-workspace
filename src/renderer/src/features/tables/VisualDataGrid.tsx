import React, { useState } from 'react';
import {
  SqliteColumnAffinity,
  SqliteColumnInfo,
  SqliteFilterRule
} from '../../../../shared/types';

interface VisualDataGridProps {
  tableName: string;
  columns: SqliteColumnInfo[];
  rows: Record<string, unknown>[];
  selectedRowIds: Set<number | string>;
  onToggleSelectRow: (rowId: number | string) => void;
  onToggleSelectAll: () => void;
  onInsertRow: (values: Record<string, unknown>) => void;
  onUpdateCell: (rowId: number | string, colName: string, value: unknown) => void;
  onDeleteSelectedRows: () => void;
  onAddColumn: (name: string, type: SqliteColumnAffinity, defaultVal?: string) => void;
  onRenameColumn: (oldName: string, newName: string) => void;
  onDropColumn: (colName: string) => void;
  sortColumn: string;
  sortDirection: 'ASC' | 'DESC';
  onSortChange: (colName: string) => void;
  filterRule: SqliteFilterRule | null;
  onFilterChange: (rule: SqliteFilterRule | null) => void;
  nullLabel: string;
}

/**
 * Visual SQLite Data Grid (`#1E1E1E` / `#161616`).
 * Supports viewing tables, adding/renaming/dropping columns, inserting rows,
 * inline cell editing, deleting rows, and visual filtering/sorting.
 */
export const VisualDataGrid: React.FC<VisualDataGridProps> = ({
  tableName,
  columns,
  rows,
  selectedRowIds,
  onToggleSelectRow,
  onToggleSelectAll,
  onInsertRow,
  onUpdateCell,
  onDeleteSelectedRows,
  onAddColumn,
  onRenameColumn,
  onDropColumn,
  sortColumn,
  sortDirection,
  onSortChange,
  filterRule,
  onFilterChange,
  nullLabel
}) => {
  const [editingCell, setEditingCell] = useState<{
    rowId: number | string;
    colName: string;
    value: string;
  } | null>(null);

  const [showColumnModal, setShowColumnModal] = useState<
    'add' | 'rename' | 'drop' | null
  >(null);
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<SqliteColumnAffinity>('TEXT');
  const [targetColName, setTargetColName] = useState<string>(
    columns[1]?.name || columns[0]?.name || ''
  );

  const [filterCol, setFilterCol] = useState<string>(columns[0]?.name || 'id');
  const [filterOp, setFilterOp] = useState<SqliteFilterRule['operator']>('contains');
  const [filterVal, setFilterVal] = useState<string>('');

  const handleQuickInsertRow = (): void => {
    const defaultRow: Record<string, unknown> = {};
    for (const col of columns) {
      if (col.pk) continue;
      if (col.type.includes('INT')) defaultRow[col.name] = 0;
      else if (col.type.includes('REAL')) defaultRow[col.name] = 0.0;
      else defaultRow[col.name] = 'New Value';
    }
    onInsertRow(defaultRow);
  };

  const commitInlineEdit = (): void => {
    if (!editingCell) return;
    onUpdateCell(editingCell.rowId, editingCell.colName, editingCell.value);
    setEditingCell(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1E1E1E]">
      {/* Grid Action & Visual Filter Bar */}
      <div className="p-2.5 bg-[#161616] border-b border-[#2D2D2D] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleQuickInsertRow}
            className="px-2.5 py-1 font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] transition-colors"
          >
            + Insert Row
          </button>
          <button
            type="button"
            disabled={selectedRowIds.size === 0}
            onClick={onDeleteSelectedRows}
            className="px-2.5 py-1 rounded bg-[#1E1E1E] hover:bg-red-950/60 disabled:opacity-40 text-[#E6E6E6] border border-[#2D2D2D]"
          >
            Delete Selected ({selectedRowIds.size})
          </button>

          <span className="mx-1 h-4 w-[1px] bg-[#2D2D2D]" />

          <button
            type="button"
            onClick={() => setShowColumnModal('add')}
            className="px-2 py-1 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D]"
          >
            + Add Column
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetColName(columns[1]?.name || columns[0]?.name || '');
              setShowColumnModal('rename');
            }}
            className="px-2 py-1 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#2D2D2D]"
          >
            Rename Column
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetColName(columns[columns.length - 1]?.name || '');
              setShowColumnModal('drop');
            }}
            className="px-2 py-1 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D]"
          >
            Drop Column
          </button>
        </div>

        {/* Visual Filter Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#9E9E9E]">Filter:</span>
          <select
            value={filterCol}
            onChange={(e) => setFilterCol(e.target.value)}
            className="px-2 py-1 rounded bg-[#1E1E1E] border border-[#2D2D2D] text-[#E6E6E6]"
          >
            {columns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterOp}
            onChange={(e) =>
              setFilterOp(e.target.value as SqliteFilterRule['operator'])
            }
            className="px-2 py-1 rounded bg-[#1E1E1E] border border-[#2D2D2D] text-[#E6E6E6]"
          >
            <option value="contains">contains</option>
            <option value="equals">equals</option>
            <option value="starts_with">starts with</option>
            <option value="gt">&gt;</option>
            <option value="lt">&lt;</option>
          </select>
          <input
            type="text"
            value={filterVal}
            onChange={(e) => {
              const v = e.target.value;
              setFilterVal(v);
              if (v.trim()) {
                onFilterChange({ column: filterCol, operator: filterOp, value: v });
              } else {
                onFilterChange(null);
              }
            }}
            placeholder="Value..."
            className="px-2 py-1 rounded bg-[#1E1E1E] border border-[#2D2D2D] focus:border-[#4A2574] text-[#E6E6E6] w-32 focus:outline-none"
          />
          {filterRule && (
            <button
              type="button"
              onClick={() => {
                setFilterVal('');
                onFilterChange(null);
              }}
              className="px-1.5 py-1 rounded bg-[#2A1B3D] text-[#E6E6E6]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Column Schema Action Inline Bar */}
      {showColumnModal && (
        <div className="px-3 py-2 bg-[#2A1B3D]/70 border-b border-[#4A2574] flex items-center justify-between text-xs">
          {showColumnModal === 'add' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E6E6E6]">
                Add Column to {tableName}:
              </span>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="column_name"
                className="px-2 py-1 rounded bg-[#161616] border border-[#4A2574] text-[#E6E6E6] font-mono"
              />
              <select
                value={newColType}
                onChange={(e) =>
                  setNewColType(e.target.value as SqliteColumnAffinity)
                }
                className="px-2 py-1 rounded bg-[#161616] border border-[#4A2574] text-[#E6E6E6]"
              >
                <option value="TEXT">TEXT</option>
                <option value="INTEGER">INTEGER</option>
                <option value="REAL">REAL</option>
                <option value="NUMERIC">NUMERIC</option>
                <option value="BLOB">BLOB</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (newColName.trim()) {
                    onAddColumn(newColName.trim(), newColType);
                    setNewColName('');
                    setShowColumnModal(null);
                  }
                }}
                className="px-3 py-1 font-semibold rounded bg-[#4A2574] text-[#E6E6E6]"
              >
                Confirm Add
              </button>
            </div>
          )}

          {showColumnModal === 'rename' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E6E6E6]">Rename Column:</span>
              <select
                value={targetColName}
                onChange={(e) => setTargetColName(e.target.value)}
                className="px-2 py-1 rounded bg-[#161616] border border-[#4A2574] text-[#E6E6E6]"
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span>to</span>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="new_column_name"
                className="px-2 py-1 rounded bg-[#161616] border border-[#4A2574] text-[#E6E6E6] font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (targetColName && newColName.trim()) {
                    onRenameColumn(targetColName, newColName.trim());
                    setNewColName('');
                    setShowColumnModal(null);
                  }
                }}
                className="px-3 py-1 font-semibold rounded bg-[#4A2574] text-[#E6E6E6]"
              >
                Confirm Rename
              </button>
            </div>
          )}

          {showColumnModal === 'drop' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E6E6E6]">Drop Column:</span>
              <select
                value={targetColName}
                onChange={(e) => setTargetColName(e.target.value)}
                className="px-2 py-1 rounded bg-[#161616] border border-[#4A2574] text-[#E6E6E6]"
              >
                {columns
                  .filter((c) => !c.pk)
                  .map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (targetColName) {
                    onDropColumn(targetColName);
                    setShowColumnModal(null);
                  }
                }}
                className="px-3 py-1 font-semibold rounded bg-red-800/80 text-[#E6E6E6]"
              >
                Confirm Drop
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowColumnModal(null)}
            className="text-[#9E9E9E] hover:text-[#E6E6E6]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Data Table Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-[#161616] z-10">
            <tr>
              <th className="w-9 border-b border-r border-[#2D2D2D] p-2 text-center">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRowIds.size === rows.length}
                  onChange={onToggleSelectAll}
                  className="accent-[#7E42C1]"
                />
              </th>
              {columns.map((col) => {
                const isSorted = sortColumn === col.name;
                return (
                  <th
                    key={col.name}
                    onClick={() => onSortChange(col.name)}
                    className="border-b border-r border-[#2D2D2D] px-3 py-2 text-left font-semibold text-[#E6E6E6] hover:bg-[#2A1B3D]/50 cursor-pointer select-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {col.pk && (
                          <span className="text-[10px] px-1 rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574]">
                            PK
                          </span>
                        )}
                        <span>{col.name}</span>
                        <span className="text-[10px] font-mono text-[#9E9E9E]">
                          {col.type}
                        </span>
                      </div>
                      {isSorted && (
                        <span className="text-[#7E42C1]">
                          {sortDirection === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rIdx) => {
              const rowId = (row._rowid_ ?? row.id ?? rIdx + 1) as number | string;
              const isSelected = selectedRowIds.has(rowId);

              return (
                <tr
                  key={`row-${rowId}`}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-[#2A1B3D]/70'
                      : 'hover:bg-[#161616]/80'
                  }`}
                >
                  <td className="border-b border-r border-[#2D2D2D] p-2 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(rowId)}
                      className="accent-[#7E42C1]"
                    />
                  </td>

                  {columns.map((col) => {
                    const cellVal = row[col.name];
                    const isEditing =
                      editingCell?.rowId === rowId &&
                      editingCell?.colName === col.name;

                    return (
                      <td
                        key={`${rowId}-${col.name}`}
                        onDoubleClick={() => {
                          if (!col.pk) {
                            setEditingCell({
                              rowId,
                              colName: col.name,
                              value:
                                cellVal === null || cellVal === undefined
                                  ? ''
                                  : String(cellVal)
                            });
                          }
                        }}
                        className="border-b border-r border-[#2D2D2D] px-3 py-1.5 text-[#E6E6E6] font-mono"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingCell.value}
                            onChange={(e) =>
                              setEditingCell({
                                ...editingCell,
                                value: e.target.value
                              })
                            }
                            onBlur={commitInlineEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitInlineEdit();
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full px-1.5 py-0.5 rounded bg-[#161616] border border-[#4A2574] text-[#E6E6E6] focus:outline-none"
                          />
                        ) : cellVal === null || cellVal === undefined ? (
                          <span className="italic text-[#9E9E9E]">{nullLabel}</span>
                        ) : (
                          <span>{String(cellVal)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
