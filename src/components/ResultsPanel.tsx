"use client";
import { useState, useMemo, useCallback } from "react";
import { useQueryStore } from "@/store/queryStore";
import { executeQuery } from "@/lib/queryExecutor";
import { SCHEMAS } from "@/lib/schema";
import { validateQuery } from "@/lib/validators";

export default function ResultsPanel() {
  const { root, schemaId } = useQueryStore();
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;

  const [page, setPage] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<{
    results: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const errors = useMemo(() => validateQuery(root, schema), [root, schema]);

  const handleRun = useCallback(async () => {
    if (errors.length > 0) return;
    setIsRunning(true);
    setHasRun(false);
    // simulate async
    await new Promise((r) => setTimeout(r, 350));
    const res = executeQuery(schemaId, root, page);
    setResults(res);
    setHasRun(true);
    setIsRunning(false);
  }, [schemaId, root, page, errors]);

  const handlePageChange = useCallback(
    async (newPage: number) => {
      setPage(newPage);
      setIsRunning(true);
      await new Promise((r) => setTimeout(r, 150));
      const res = executeQuery(schemaId, root, newPage);
      setResults(res);
      setIsRunning(false);
    },
    [schemaId, root],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Results
          </span>
          {hasRun && results && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
              {results.total} row{results.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning || errors.length > 0}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
            ${
              errors.length > 0
                ? "opacity-40 cursor-not-allowed bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                : "bg-violet-600 hover:bg-violet-700 active:scale-95 text-white shadow-sm"
            }
          `}
        >
          {isRunning ? (
            <>
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Running…
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run Query
            </>
          )}
        </button>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
            Fix {errors.length} error{errors.length !== 1 ? "s" : ""} before
            running
          </p>
          <ul className="text-xs text-red-500 dark:text-red-400 space-y-0.5">
            {errors.slice(0, 3).map((e) => (
              <li key={e.nodeId}>• {e.message}</li>
            ))}
            {errors.length > 3 && <li>• …and {errors.length - 3} more</li>}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!hasRun && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 dark:text-zinc-600">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <p className="text-sm">Build a query and run it to see results</p>
          </div>
        )}

        {isRunning && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 dark:text-zinc-600">
            <svg
              className="animate-spin"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <p className="text-sm">Executing query…</p>
          </div>
        )}

        {hasRun && results && !isRunning && (
          <>
            {results.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400 dark:text-zinc-600">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <p className="text-sm">No results match your query</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 sticky top-0">
                      {schema.fields.map((f) => (
                        <th
                          key={f.name}
                          className="text-left px-3 py-2 font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap"
                        >
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {schema.fields.map((f) => (
                          <td
                            key={f.name}
                            className="px-3 py-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap max-w-[180px] truncate"
                          >
                            {renderCell(row[f.name], f.type)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {hasRun && results && results.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {(results.page - 1) * results.pageSize + 1}–
            {Math.min(results.page * results.pageSize, results.total)} of{" "}
            {results.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(results.page - 1)}
              disabled={results.page <= 1}
              className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            >
              ‹ Prev
            </button>
            <span className="px-2">
              {results.page} / {results.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(results.page + 1)}
              disabled={results.page >= results.totalPages}
              className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell(value: unknown, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return (
      <span className="text-zinc-300 dark:text-zinc-600 italic">null</span>
    );
  }
  if (type === "boolean") {
    return (
      <span
        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          value
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
        }`}
      >
        {String(value)}
      </span>
    );
  }
  if (type === "enum") {
    return (
      <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
        {String(value)}
      </span>
    );
  }
  return String(value);
}
