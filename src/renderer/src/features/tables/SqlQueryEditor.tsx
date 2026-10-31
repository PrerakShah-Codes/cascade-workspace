import React, { useState } from 'react';
import { SqliteRawExecutionResult } from '../../../../shared/types';

interface SqlQueryEditorProps {
  defaultSql?: string;
  onExecuteSql: (sql: string) => Promise<SqliteRawExecutionResult>;
  onExportResultToPdf: (result: SqliteRawExecutionResult, sql: string) => void;
}

/**
 * Raw SQL Query Editor for `.db` / `.sqlite` databases.
 * Runs custom `SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`, or `JOIN` queries
 * and renders tabular results or execution logs.
 */
export const SqlQueryEditor: React.FC<SqlQueryEditorProps> = ({
  defaultSql = 'SELECT subsystem, operation, latency_ms, throughput_ops, status\nFROM benchmark_runs\nWHERE latency_ms < 50\nORDER BY throughput_ops DESC;',
  onExecuteSql,
  onExportResultToPdf
}) => {
  const [sql, setSql] = useState<string>(defaultSql);
  const [result, setResult] = useState<SqliteRawExecutionResult | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  const handleRun = async (): Promise<void> => {
    setRunning(true);
    try {
      const res = await onExecuteSql(sql);
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  const handleFormatSql = (): void => {
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'ORDER BY',
      'GROUP BY',
      'INNER JOIN',
      'LEFT JOIN',
      'INSERT INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE FROM',
      'CREATE TABLE',
      'LIMIT'
    ];
    let formatted = sql.trim();
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw);
    }
    setSql(formatted);
  };

  return (
    <div className="h-64 border-t border-[#2D2D2D] bg-[#161616] flex flex-col">
      {/* SQL Editor Toolbar */}
      <div className="px-3 py-1.5 border-b border-[#2D2D2D] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#2A1B3D] text-[#7E42C1] border border-[#4A2574]">
            Raw SQL Query Console
          </span>
          <span className="text-[#9E9E9E]">
            Supports SELECT, INSERT, UPDATE, CREATE TABLE, JOIN
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFormatSql}
            className="px-2.5 py-1 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#9E9E9E] hover:text-[#E6E6E6] border border-[#2D2D2D]"
          >
            Format SQL
          </button>
          {result && result.rows.length > 0 && (
            <button
              type="button"
              onClick={() => onExportResultToPdf(result, sql)}
              className="px-2.5 py-1 rounded bg-[#1E1E1E] hover:bg-[#2A1B3D] text-[#E6E6E6] border border-[#4A2574]"
            >
              Export Query Results to PDF
            </button>
          )}
          <button
            type="button"
            disabled={running}
            onClick={handleRun}
            className="px-3 py-1 font-semibold rounded bg-[#4A2574] hover:bg-[#7E42C1] text-[#E6E6E6] transition-colors"
          >
            {running ? 'Running…' : '▶ Run SQL (Ctrl+Enter)'}
          </button>
        </div>
      </div>

      {/* Split Query Input + Result Output */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleRun();
            }
          }}
          className="w-full h-full p-3 bg-[#1E1E1E] text-[#E6E6E6] font-mono text-xs border-r border-[#2D2D2D] resize-none focus:outline-none"
          placeholder="Write custom SQL query..."
        />

        <div className="h-full overflow-auto p-3 bg-[#161616] text-xs">
          {!result ? (
            <div className="text-[#9E9E9E] font-mono">
              Press &quot;Run SQL&quot; to execute against better-sqlite3 and view results or execution logs.
            </div>
          ) : result.statementType === 'ERROR' ? (
            <div className="p-2.5 rounded bg-red-950/50 border border-red-700 text-red-200 font-mono">
              {result.message}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-[#7E42C1]">
                ✓ {result.message}
              </div>
              {result.rows.length > 0 && (
                <table className="w-full border-collapse text-[11px] font-mono">
                  <thead>
                    <tr>
                      {result.columns.map((c) => (
                        <th
                          key={c}
                          className="border border-[#4A2574] bg-[#2A1B3D] px-2 py-1 text-left text-[#E6E6E6]"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r, i) => (
                      <tr key={i}>
                        {result.columns.map((c) => (
                          <td
                            key={c}
                            className="border border-[#2D2D2D] px-2 py-1 text-[#E6E6E6]"
                          >
                            {String(r[c] ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
