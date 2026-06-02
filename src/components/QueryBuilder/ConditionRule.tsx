"use client";
import { memo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QueryRule, FieldType, ValidationError } from "@/types/query";
import { useQueryStore } from "@/store/queryStore";
import { SCHEMAS } from "@/lib/schema";
import { getError } from "@/lib/validators";
import FieldSelector from "./FieldSelector";
import OperatorSelector from "./OperatorSelector";
import ValueInput from "./ValueInput";

interface Props {
  rule: QueryRule;
  parentId: string;
  errors: ValidationError[];
}

export const ConditionRule = memo(function ConditionRule({
  rule,
  errors,
}: Props) {
  const { schemaId, updateRule, removeRule, pushHistory } = useQueryStore();
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;
  const field = schema.fields.find((f) => f.name === rule.field);
  const fieldType: FieldType = field?.type ?? "string";
  const error = getError(rule.id, errors);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFieldChange = useCallback(
    (fieldName: string) => {
      pushHistory();
      updateRule(rule.id, { field: fieldName });
    },
    [rule.id, updateRule, pushHistory]
  );

  const handleOperatorChange = useCallback(
    (operator: QueryRule["operator"]) => {
      updateRule(rule.id, { operator });
    },
    [rule.id, updateRule]
  );

  const handleValueChange = useCallback(
    (val: QueryRule["value"]) => {
      updateRule(rule.id, { value: val });
    },
    [rule.id, updateRule]
  );

  const needsValue = !["is_null", "is_not_null"].includes(rule.operator);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex flex-col items-stretch gap-2 p-2.5 rounded-lg border transition-all sm:flex-row sm:items-start
        ${
          error
            ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
            : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
        }
      `}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0 cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 flex-shrink-0 self-start sm:mt-2"
        aria-label="Drag to reorder"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="4" cy="3" r="1.5" />
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="4" cy="13" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Field selector */}
      <FieldSelector
        schemaId={schemaId}
        value={rule.field}
        onChange={handleFieldChange}
      />

      {/* Operator selector */}
      <OperatorSelector
        fieldType={fieldType}
        value={rule.operator}
        onChange={handleOperatorChange}
      />

      {/* Value input */}
      {needsValue && (
        <div className="flex-1 min-w-0">
          <ValueInput
            rule={rule}
            fieldType={fieldType}
            enumValues={field?.enumValues}
            onChange={handleValueChange}
          />
        </div>
      )}
      {!needsValue && <div className="flex-1" />}

      {/* Inline error */}
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400 mt-2.5 whitespace-nowrap">
          {error}
        </span>
      )}

      {/* Remove button */}
      <button
        onClick={() => removeRule(rule.id)}
        className="mt-0 flex-shrink-0 self-start p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-100 sm:mt-1.5 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Remove rule"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
});
