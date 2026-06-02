"use client";
import { useState, useMemo, useEffect } from "react";
import { useQueryStore } from "@/store/queryStore";
import { ConditionGroup } from "@/components/QueryBuilder/ConditionGroup";
import QueryPreview from "@/components/QueryPreview";
import ResultsPanel from "@/components/ResultsPanel";
import TopBar from "@/components/TopBar";
import { SCHEMAS } from "@/lib/schema";
import { validateQuery } from "@/lib/validators";

export default function Home() {
  const { root, schemaId } = useQueryStore();
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof window !== "undefined" && localStorage.getItem("qb-dark") === "true",
  );

  useEffect(() => {
    localStorage.setItem("qb-dark", String(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const errors = useMemo(() => validateQuery(root, schema), [root, schema]);

  return (
    <div
      className={`flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors`}
    >
      <TopBar darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />

      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Left: Query Builder */}
        <div className="flex flex-col w-1/2 min-w-0 border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Query Builder
            </span>
            <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {schema.name}
              </span>
              {errors.length > 0 && (
                <span className="text-red-500 dark:text-red-400">
                  {errors.length} error{errors.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ConditionGroup group={root} errors={errors} isRoot depth={0} />
          </div>
        </div>

        {/* Right: Preview + Results */}
        <div className="flex flex-col w-1/2 min-w-0 overflow-hidden">
          {/* Query Preview - top half */}
          <div className="flex flex-col h-1/2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <QueryPreview />
          </div>
          {/* Results - bottom half */}
          <div className="flex flex-col h-1/2 bg-white dark:bg-zinc-900">
            <ResultsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
