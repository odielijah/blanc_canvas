"use client";
import { useMemo } from "react";
import { useQueryStore } from "@/features/query-builder/store/queryStore";
import { SCHEMAS } from "@/features/query-builder/lib/schema";
import { validateQuery } from "@/features/query-builder/lib/validators";
import { ConditionGroup } from "./ConditionGroup";

export function QueryBuilder() {
  const { root, schemaId, setSchema } = useQueryStore();
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;
  const errors = useMemo(() => validateQuery(root, schema), [root, schema]);

  const handleSchemaChange = (id: string) => {
    const nextSchema = SCHEMAS.find((s) => s.id === id)!;
    setSchema(id, nextSchema.fields[0].name);
  };

  return (
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
  );
}
