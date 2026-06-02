"use client";
import { memo } from "react";
import { FieldType, Operator, OPERATORS_BY_TYPE, OPERATOR_LABELS } from "@/types/query";

interface Props {
  fieldType: FieldType;
  value: Operator;
  onChange: (operator: Operator) => void;
}

const OperatorSelector = memo(function OperatorSelector({
  fieldType,
  value,
  onChange,
}: Props) {
  const operators = OPERATORS_BY_TYPE[fieldType];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Operator)}
      className="rule-select w-44 flex-shrink-0"
      aria-label="Operator"
    >
      {operators.map((op) => (
        <option key={op} value={op}>
          {OPERATOR_LABELS[op]}
        </option>
      ))}
    </select>
  );
});

export default OperatorSelector;