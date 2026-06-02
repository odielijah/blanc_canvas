"use client";
import { useMemo } from "react";
import { useQueryStore } from "@/store/queryStore";
import { SCHEMAS } from "@/lib/schema";
import { validateQuery } from "@/lib/validators";
import { ConditionGroup } from "./ConditionGroup";

export function QueryBuilder() {
  const { root, schemaId } = useQueryStore();
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;
  const errors = useMemo(() => validateQuery(root, schema), [root, schema]);

  return (
    <div className="flex flex-col gap-3">
      <ConditionGroup
        group={root}
        errors={errors}
        isRoot
        depth={0}
      />
    </div>
  );
}