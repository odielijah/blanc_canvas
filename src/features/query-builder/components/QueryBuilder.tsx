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
    <div className="panel-surface flex min-h-[28rem] min-w-0 flex-col overflow-hidden lg:min-h-0">
      <div className="panel-header flex flex-col gap-2 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="panel-title text-xs tracking-[0.7px] uppercase font-semibold">
          Query Builder
        </span>
        <div className="text-muted-theme flex flex-wrap items-center gap-2 text-xs">
          <label className="flex min-w-0 items-center gap-1.5">
            <span>Source:</span>
            <select
              value={schemaId}
              onChange={(e) => handleSchemaChange(e.target.value)}
              className="theme-input max-w-full text-xs font-medium"
            >
              {SCHEMAS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {errors.length > 0 && (
            <span className="danger-pill rounded-full px-2 py-0.5">
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
