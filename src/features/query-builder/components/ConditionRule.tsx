"use client";
import { memo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QueryRule, FieldType, ValidationError } from "@/shared/types/query";
import { useQueryStore } from "@/features/query-builder/store/queryStore";
import { SCHEMAS } from "@/features/query-builder/lib/schema";
import { getError } from "@/features/query-builder/lib/validators";
import FieldSelector from "./FieldSelector";
import OperatorSelector from "./OperatorSelector";
import ValueInput from "./ValueInput";
import { GripDotsIcon, XIcon } from "./icons";

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
        condition-rule group flex flex-col items-stretch gap-2 rounded-lg p-2.5 transition-all sm:flex-row sm:items-start
        ${
          error
            ? "condition-rule-error"
            : ""
        }
      `}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted-theme mt-0 flex-shrink-0 cursor-grab self-start transition-colors hover:text-[var(--accent-strong)] active:cursor-grabbing sm:mt-2"
        aria-label="Drag to reorder"
      >
        <GripDotsIcon />
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
        <span className="mt-2.5 whitespace-nowrap text-xs text-[var(--danger)]">
          {error}
        </span>
      )}

      {/* Remove button */}
      <button
        onClick={() => removeRule(rule.id)}
        className="danger-button mt-0 flex-shrink-0 self-start rounded-md p-1.5 opacity-100 transition-colors sm:mt-1.5 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Remove rule"
      >
        <XIcon />
      </button>
    </div>
  );
});
