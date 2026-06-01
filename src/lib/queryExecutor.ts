import { QueryGroup, QueryRule, Operator } from "@/types/query";
import { MOCK_DATA } from "./schema";

// ── Single rule evaluator ──────────────────────────────────────────────────

function evalRule(row: Record<string, unknown>, rule: QueryRule): boolean {
  const raw = row[rule.field];
  const val =
    raw !== undefined && raw !== null ? String(raw).toLowerCase() : null;
  const ruleVal =
    rule.value !== null && rule.value !== undefined
      ? String(rule.value).toLowerCase()
      : "";

  switch (rule.operator as Operator) {
    case "equals":
      return val === ruleVal;
    case "not_equals":
      return val !== ruleVal;
    case "contains":
      return val !== null && val.includes(ruleVal);
    case "not_contains":
      return val !== null && !val.includes(ruleVal);
    case "starts_with":
      return val !== null && val.startsWith(ruleVal);
    case "ends_with":
      return val !== null && val.endsWith(ruleVal);
    case "greater_than": {
      const n = parseFloat(String(raw));
      return !isNaN(n) && n > parseFloat(ruleVal);
    }
    case "less_than": {
      const n = parseFloat(String(raw));
      return !isNaN(n) && n < parseFloat(ruleVal);
    }
    case "greater_than_or_equal": {
      const n = parseFloat(String(raw));
      return !isNaN(n) && n >= parseFloat(ruleVal);
    }
    case "less_than_or_equal": {
      const n = parseFloat(String(raw));
      return !isNaN(n) && n <= parseFloat(ruleVal);
    }
    case "is_null":
      return raw === null || raw === undefined || raw === "";
    case "is_not_null":
      return raw !== null && raw !== undefined && raw !== "";
    case "regex": {
      try {
        return new RegExp(rule.value as string, "i").test(String(raw));
      } catch {
        return false;
      }
    }
    case "between": {
      const arr = Array.isArray(rule.value) ? rule.value : [];
      if (arr.length < 2) return true;
      const n = parseFloat(String(raw));
      return (
        !isNaN(n) &&
        n >= parseFloat(String(arr[0])) &&
        n <= parseFloat(String(arr[1]))
      );
    }
    case "in_array": {
      const items = Array.isArray(rule.value)
        ? rule.value.map((v) => String(v).toLowerCase())
        : String(rule.value)
            .split(",")
            .map((v) => v.trim().toLowerCase());
      return val !== null && items.includes(val);
    }
    case "not_in_array": {
      const items = Array.isArray(rule.value)
        ? rule.value.map((v) => String(v).toLowerCase())
        : String(rule.value)
            .split(",")
            .map((v) => v.trim().toLowerCase());
      return val !== null && !items.includes(val);
    }
    default:
      return true;
  }
}

// ── Group evaluator (recursive) ────────────────────────────────────────────

function evalGroup(row: Record<string, unknown>, group: QueryGroup): boolean {
  if (group.children.length === 0) return true;

  const results = group.children.map((child) => {
    if (child.type === "rule") {
      const r = child as QueryRule;
      // skip empty/incomplete rules
      const needsValue = !["is_null", "is_not_null"].includes(r.operator);
      if (
        needsValue &&
        (r.value === "" || r.value === null || r.value === undefined)
      )
        return true;
      if (!r.field) return true;
      return evalRule(row, r);
    }
    return evalGroup(row, child as QueryGroup);
  });

  return group.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
}

// ── Public executor ────────────────────────────────────────────────────────

export function executeQuery(
  schemaId: string,
  group: QueryGroup,
  page = 1,
  pageSize = 10,
): {
  results: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const dataset = MOCK_DATA[schemaId] ?? [];
  const filtered = dataset.filter((row) => evalGroup(row, group));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    results: paginated,
    total,
    page,
    pageSize,
    totalPages,
  };
}
