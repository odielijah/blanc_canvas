import { QueryGroup, QueryRule, QueryFormat } from "@/shared/types/query";

// ── SQL Generator ─────────────────────────────────────────────────────────────

function sqlIdentifier(value: string): string {
  return `\`${value.replace(/`/g, "``")}\``;
}

function sqlString(value: unknown): string {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlLiteral(value: unknown): string {
  return typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : sqlString(value);
}

function sqlComparable(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return value;
  }
  return sqlString(value);
}

function toList(value: QueryRule["value"]): unknown[] {
  return Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
}

function ruleToSQL(rule: QueryRule): string {
  const { field, operator, value } = rule;
  const f = sqlIdentifier(field);

  switch (operator) {
    case "equals":             return `${f} = ${sqlLiteral(value)}`;
    case "not_equals":         return `${f} != ${sqlLiteral(value)}`;
    case "contains":           return `${f} LIKE ${sqlString(`%${value}%`)}`;
    case "not_contains":       return `${f} NOT LIKE ${sqlString(`%${value}%`)}`;
    case "starts_with":        return `${f} LIKE ${sqlString(`${value}%`)}`;
    case "ends_with":          return `${f} LIKE ${sqlString(`%${value}`)}`;
    case "greater_than":       return `${f} > ${sqlComparable(value)}`;
    case "less_than":          return `${f} < ${sqlComparable(value)}`;
    case "greater_than_or_equal": return `${f} >= ${sqlComparable(value)}`;
    case "less_than_or_equal": return `${f} <= ${sqlComparable(value)}`;
    case "is_null":            return `${f} IS NULL`;
    case "is_not_null":        return `${f} IS NOT NULL`;
    case "regex":              return `${f} REGEXP ${sqlString(value)}`;
    case "between": {
      const [a, b] = Array.isArray(value) ? value : [value, value];
      return `${f} BETWEEN ${sqlComparable(a)} AND ${sqlComparable(b)}`;
    }
    case "in_array": {
      const vals = toList(value);
      return `${f} IN (${vals.map(sqlLiteral).join(", ")})`;
    }
    case "not_in_array": {
      const vals = toList(value);
      return `${f} NOT IN (${vals.map(sqlLiteral).join(", ")})`;
    }
    default: return `${f} = ${sqlLiteral(value)}`;
  }
}

function groupToSQL(group: QueryGroup, depth = 0): string {
  if (group.children.length === 0) return "";

  const parts = group.children
    .filter((c) => {
      if (c.type === "rule") {
        const r = c as QueryRule;
        return r.field && r.operator && !["is_null", "is_not_null"].includes(r.operator)
          ? r.value !== "" && r.value !== null && r.value !== undefined
          : true;
      }
      return true;
    })
    .map((child): string => {
      if (child.type === "rule") return ruleToSQL(child as QueryRule);
      const nested = groupToSQL(child as QueryGroup, depth + 1);
      return nested ? `(${nested})` : "";
    })
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return parts.join(`\n${"  ".repeat(depth)}${group.logic} `);
}

export function generateSQL(group: QueryGroup, tableName = "records"): string {
  const where = groupToSQL(group);
  return where
    ? `SELECT * FROM \`${tableName}\`\nWHERE ${where}`
    : `SELECT * FROM \`${tableName}\``;
}

// ── Mongo Generator ───────────────────────────────────────────────────────────

function escapeRegex(value: unknown): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleToMongo(rule: QueryRule): Record<string, unknown> {
  const { field, operator, value } = rule;

  const parsedNumber = typeof value === "string" ? Number(value) : value;
  const numVal =
    typeof parsedNumber === "number" && Number.isFinite(parsedNumber)
      ? parsedNumber
      : value;

  switch (operator) {
    case "equals":             return { [field]: value };
    case "not_equals":         return { [field]: { $ne: value } };
    case "contains":           return { [field]: { $regex: escapeRegex(value), $options: "i" } };
    case "not_contains":       return { [field]: { $not: { $regex: escapeRegex(value), $options: "i" } } };
    case "starts_with":        return { [field]: { $regex: `^${escapeRegex(value)}` } };
    case "ends_with":          return { [field]: { $regex: `${escapeRegex(value)}$` } };
    case "greater_than":       return { [field]: { $gt: numVal } };
    case "less_than":          return { [field]: { $lt: numVal } };
    case "greater_than_or_equal": return { [field]: { $gte: numVal } };
    case "less_than_or_equal": return { [field]: { $lte: numVal } };
    case "is_null":            return { [field]: null };
    case "is_not_null":        return { [field]: { $ne: null } };
    case "regex":              return { [field]: { $regex: value } };
    case "between": {
      const [a, b] = Array.isArray(value) ? value : [value, value];
      return { [field]: { $gte: a, $lte: b } };
    }
    case "in_array": {
      const vals = toList(value);
      return { [field]: { $in: vals } };
    }
    case "not_in_array": {
      const vals = toList(value);
      return { [field]: { $nin: vals } };
    }
    default: return { [field]: value };
  }
}

function groupToMongo(group: QueryGroup): Record<string, unknown> {
  if (group.children.length === 0) return {};

  const parts = group.children
    .map((child): Record<string, unknown> | null => {
      if (child.type === "rule") {
        const r = child as QueryRule;
        const needsValue = !["is_null", "is_not_null"].includes(r.operator);
        if (needsValue && (r.value === "" || r.value === null)) return null;
        if (!r.field) return null;
        return ruleToMongo(r);
      }
      const nested = groupToMongo(child as QueryGroup);
      return Object.keys(nested).length ? nested : null;
    })
    .filter(Boolean) as Record<string, unknown>[];

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];

  const key = group.logic === "AND" ? "$and" : "$or";
  return { [key]: parts };
}

export function generateMongo(group: QueryGroup): string {
  return JSON.stringify(groupToMongo(group), null, 2);
}

// ── GraphQL Generator ─────────────────────────────────────────────────────────

function gqlLiteral(value: unknown): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function gqlComparable(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return value;
  }
  return gqlLiteral(value);
}

function ruleToGQL(rule: QueryRule): string {
  const { field, operator, value } = rule;

  switch (operator) {
    case "equals":             return `${field}: { eq: ${gqlLiteral(value)} }`;
    case "not_equals":         return `${field}: { neq: ${gqlLiteral(value)} }`;
    case "contains":           return `${field}: { ilike: ${gqlLiteral(`%${value}%`)} }`;
    case "starts_with":        return `${field}: { startsWith: ${gqlLiteral(value)} }`;
    case "ends_with":          return `${field}: { endsWith: ${gqlLiteral(value)} }`;
    case "greater_than":       return `${field}: { gt: ${value} }`;
    case "less_than":          return `${field}: { lt: ${value} }`;
    case "greater_than_or_equal": return `${field}: { gte: ${value} }`;
    case "less_than_or_equal": return `${field}: { lte: ${value} }`;
    case "is_null":            return `${field}: { isNull: true }`;
    case "is_not_null":        return `${field}: { isNull: false }`;
    case "between": {
      const [a, b] = Array.isArray(value) ? value : [value, value];
      return `${field}: { gte: ${gqlComparable(a)}, lte: ${gqlComparable(b)} }`;
    }
    case "in_array": {
      const vals = toList(value);
      return `${field}: { in: [${vals.map(gqlLiteral).join(", ")}] }`;
    }
    default: return `${field}: { eq: ${gqlLiteral(value)} }`;
  }
}

function groupToGQL(group: QueryGroup, indent = 2): string {
  if (group.children.length === 0) return "";
  const pad = " ".repeat(indent);

  const parts = group.children
    .map((child): string => {
      if (child.type === "rule") return pad + ruleToGQL(child as QueryRule);
      const nested = groupToGQL(child as QueryGroup, indent + 2);
      if (!nested) return "";
      const op = (child as QueryGroup).logic.toLowerCase();
      return `${pad}${op}: {\n${nested}\n${pad}}`;
    })
    .filter(Boolean);

  if (parts.length === 0) return "";

  if (parts.length > 1) {
    const op = group.logic.toLowerCase();
    return `${pad}${op}: [\n${parts.join(",\n")}\n${pad}]`;
  }
  return parts.join("\n");
}

export function generateGraphQL(group: QueryGroup, schemaId = "records"): string {
  const filter = groupToGQL(group);
  if (!filter) return `query {\n  ${schemaId}List {\n    id\n  }\n}`;
  return `query {\n  ${schemaId}List(\n    filter: {\n${filter}\n    }\n  ) {\n    id\n  }\n}`;
}

// ── Unified generator ─────────────────────────────────────────────────────────

export function generateQuery(
  group: QueryGroup,
  format: QueryFormat,
  schemaId = "records"
): string {
  switch (format) {
    case "sql":     return generateSQL(group, schemaId);
    case "mongo":   return generateMongo(group);
    case "graphql": return generateGraphQL(group, schemaId);
  }
}
