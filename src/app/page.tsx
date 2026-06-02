"use client";
import { useMemo, useEffect, useSyncExternalStore } from "react";
import { useQueryStore } from "@/store/queryStore";
import { ConditionGroup } from "@/components/QueryBuilder/ConditionGroup";
import QueryPreview from "@/components/QueryPreview";
import ResultsPanel from "@/components/ResultsPanel";
import TopBar from "@/components/TopBar";
import { SCHEMAS } from "@/lib/schema";
import { validateQuery } from "@/lib/validators";

const DARK_MODE_KEY = "qb-dark";
const DARK_MODE_EVENT = "qb-dark-change";

function getDarkModeSnapshot() {
  return (
    typeof window !== "undefined" &&
    localStorage.getItem(DARK_MODE_KEY) === "true"
  );
}

function getDarkModeServerSnapshot() {
  return false;
}

function subscribeDarkMode(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DARK_MODE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DARK_MODE_EVENT, onStoreChange);
  };
}

export default function Home() {
  const { root, schemaId, setSchema } = useQueryStore();
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;
  const darkMode = useSyncExternalStore(
    subscribeDarkMode,
    getDarkModeSnapshot,
    getDarkModeServerSnapshot,
  );

  const setDarkMode = (next: boolean | ((current: boolean) => boolean)) => {
    if (typeof window === "undefined") return;

    const value =
      typeof next === "function" ? next(getDarkModeSnapshot()) : next;

    localStorage.setItem(DARK_MODE_KEY, String(value));
    window.dispatchEvent(new Event(DARK_MODE_EVENT));
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const errors = useMemo(() => validateQuery(root, schema), [root, schema]);
  const handleSchemaChange = (id: string) => {
    const nextSchema = SCHEMAS.find((s) => s.id === id)!;
    setSchema(id, nextSchema.fields[0].name);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex h-full max-h-[1400px] w-full max-w-[2000px] flex-col">
        <TopBar
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
        />

        <div className="no-scrollbar grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4 lg:grid-cols-2 lg:overflow-hidden">
          {/* Left: Query Builder */}
          <div className="flex min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-0">
            <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Query Builder
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <label className="flex min-w-0 items-center gap-1.5">
                  <span>Source:</span>
                  <select
                    value={schemaId}
                    onChange={(e) => handleSchemaChange(e.target.value)}
                    className="max-w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {SCHEMAS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {errors.length > 0 && (
                  <span className="text-red-500 dark:text-red-400">
                    {errors.length} error{errors.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto p-3 sm:p-4">
              <ConditionGroup group={root} errors={errors} isRoot depth={0} />
            </div>
          </div>

          {/* Right: Preview + Results */}
          <div className="grid min-h-[36rem] min-w-0 grid-rows-2 gap-4 overflow-hidden lg:min-h-0">
            {/* Query Preview - top half */}
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <QueryPreview />
            </div>
            {/* Results - bottom half */}
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <ResultsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
