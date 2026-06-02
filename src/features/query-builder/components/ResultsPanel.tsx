"use client";
import { useState, useMemo, useCallback } from "react";
import { useQueryStore } from "@/features/query-builder/store/queryStore";
import { executeQuery } from "@/features/query-builder/lib/queryExecutor";
import { SCHEMAS } from "@/features/query-builder/lib/schema";
import { validateQuery } from "@/features/query-builder/lib/validators";
import { DatabaseIcon, PlayIcon, SearchMinusIcon, SpinnerIcon } from "./icons";

export default function ResultsPanel() {
  const { root, schemaId } = useQueryStore();
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;

  const [page, setPage] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRunAttempted, setHasRunAttempted] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<{
    results: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const errors = useMemo(
    () =>
      hasRunAttempted
        ? validateQuery(root, schema, { requireComplete: true })
        : [],
    [root, schema, hasRunAttempted],
  );

  const handleRun = useCallback(async () => {
    const nextErrors = validateQuery(root, schema, { requireComplete: true });
    setHasRunAttempted(true);

    if (nextErrors.length > 0) {
      setHasRun(false);
      setResults(null);
      return;
    }

    setIsRunning(true);
    setHasRun(false);
    // simulate async
    await new Promise((r) => setTimeout(r, 350));
    const res = executeQuery(schemaId, root, page);
    setResults(res);
    setHasRun(true);
    setHasRunAttempted(false);
    setIsRunning(false);
  }, [schemaId, root, schema, page]);

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
      <div className="panel-header flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="panel-title text-xs tracking-[0.7px] uppercase font-semibold">
            Results
          </span>
          {hasRun && results && (
            <span className="status-pill rounded-full px-2 py-0.5 text-xs font-medium">
              {results.total} row{results.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`
            accent-button flex w-full items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all active:scale-95 sm:w-auto
          `}
        >
          {isRunning ? (
            <>
              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <PlayIcon />
              Run Query
            </>
          )}
        </button>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="danger-panel mx-4 mt-3 rounded-lg p-3">
          <p className="mb-1 text-xs font-semibold">
            Fix {errors.length} error{errors.length !== 1 ? "s" : ""} before
            running
          </p>
          <ul className="space-y-0.5 text-xs">
            {errors.slice(0, 3).map((e) => (
              <li key={e.nodeId}>- {e.message}</li>
            ))}
            {errors.length > 3 && <li>- and {errors.length - 3} more</li>}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!hasRun && !isRunning && (
          <div className="empty-state flex h-full flex-col items-center justify-center gap-3">
            <DatabaseIcon />
            <p className="text-sm">Build a query and run it to see results</p>
          </div>
        )}

        {isRunning && (
          <div className="empty-state flex h-full flex-col items-center justify-center gap-3">
            <SpinnerIcon className="h-8 w-8 animate-spin" strokeWidth="2" />
            <p className="text-sm">Executing query…</p>
          </div>
        )}

        {hasRun && results && !isRunning && (
          <>
            {results.results.length === 0 ? (
              <div className="empty-state flex h-full flex-col items-center justify-center gap-2">
                <SearchMinusIcon />
                <p className="text-sm">No results match your query</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="data-table w-full border-collapse text-xs">
                  <thead>
                    <tr className="sticky top-0">
                      {schema.fields.map((f) => (
                        <th
                          key={f.name}
                          className="whitespace-nowrap px-3 py-2 text-left font-semibold"
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
                        className="transition-colors"
                      >
                        {schema.fields.map((f) => (
                          <td
                            key={f.name}
                            className="max-w-[180px] truncate whitespace-nowrap px-3 py-2"
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
        <div className="text-muted-theme flex items-center justify-between px-4 py-2.5 text-xs">
          <span>
            {(results.page - 1) * results.pageSize + 1}-
            {Math.min(results.page * results.pageSize, results.total)} of{" "}
            {results.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(results.page - 1)}
              disabled={results.page <= 1}
              className="ghost-button rounded px-2 py-1 transition-colors disabled:opacity-30"
            >
              Prev
            </button>
            <span className="px-2">
              {results.page} / {results.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(results.page + 1)}
              disabled={results.page >= results.totalPages}
              className="ghost-button rounded px-2 py-1 transition-colors disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell(value: unknown, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-theme italic">null</span>;
  }
  if (type === "boolean") {
    return (
      <span
        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
          value
            ? "boolean-pill-true"
            : "boolean-pill-false"
        }`}
      >
        {String(value)}
      </span>
    );
  }
  if (type === "enum") {
    return (
      <span className="enum-pill rounded px-1.5 py-0.5 font-mono text-xs">
        {String(value)}
      </span>
    );
  }
  return String(value);
}
