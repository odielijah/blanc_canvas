import type { FieldType, QueryRule } from "@/types/query";

interface ValueInputProps {
  rule: QueryRule;
  fieldType: FieldType;
  enumValues?: string[];
  onChange: (val: QueryRule["value"]) => void;
}

export default function ValueInput({
  rule,
  fieldType,
  enumValues,
  onChange,
}: ValueInputProps) {
  const cls = "rule-input w-full";

  if (rule.operator === "between") {
    const arr = Array.isArray(rule.value)
      ? (rule.value as [string, string])
      : ["", ""];
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="number"
          value={arr[0]}
          onChange={(e) =>
            onChange([e.target.value, arr[1]] as [string, string])
          }
          placeholder="Min"
          className={`${cls} min-w-24 flex-1`}
          aria-label="Minimum value"
        />
        <span className="text-xs text-zinc-400">–</span>
        <input
          type="number"
          value={arr[1]}
          onChange={(e) =>
            onChange([arr[0], e.target.value] as [string, string])
          }
          placeholder="Max"
          className={`${cls} min-w-24 flex-1`}
          aria-label="Maximum value"
        />
      </div>
    );
  }

  if (rule.operator === "in_array" || rule.operator === "not_in_array") {
    return (
      <input
        type="text"
        value={
          Array.isArray(rule.value)
            ? rule.value.join(", ")
            : String(rule.value ?? "")
        }
        onChange={(e) => onChange(e.target.value)}
        placeholder="value1, value2, …"
        className={cls}
        aria-label="Values (comma-separated)"
      />
    );
  }

  if (fieldType === "boolean") {
    return (
      <select
        value={String(rule.value ?? "true")}
        onChange={(e) => onChange(e.target.value === "true")}
        className={cls}
        aria-label="Boolean value"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (fieldType === "enum" && enumValues) {
    return (
      <select
        value={String(rule.value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
        aria-label="Enum value"
      >
        <option value="">Select a value…</option>
        {enumValues.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    );
  }

  if (fieldType === "date") {
    return (
      <input
        type="date"
        value={String(rule.value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
        aria-label="Date value"
      />
    );
  }

  if (fieldType === "number") {
    return (
      <input
        type="number"
        value={String(rule.value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter number…"
        className={cls}
        aria-label="Number value"
      />
    );
  }

  return (
    <input
      type="text"
      value={String(rule.value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value…"
      className={cls}
      aria-label="Text value"
    />
  );
}
