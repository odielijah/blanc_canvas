"use client";
import { memo } from "react";
import { SCHEMAS } from "@/features/query-builder/lib/schema";

interface Props {
  schemaId: string;
  value: string;
  onChange: (field: string) => void;
}

const FieldSelector = memo(function FieldSelector({
  schemaId,
  value,
  onChange,
}: Props) {
  const schema = SCHEMAS.find((s) => s.id === schemaId)!;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rule-select w-full flex-shrink-0 sm:w-36"
      aria-label="Field"
    >
      {schema.fields.map((f) => (
        <option key={f.name} value={f.name}>
          {f.label}
        </option>
      ))}
    </select>
  );
});

export default FieldSelector;
