import { QueryGroup, QueryRule, QueryNode, Operator, QueryFormat } from "@/types/query";

// ── SQL Generator ─────────────────────────────────────────────────────────────

function ruleToSQL(rule: QueryRule): string {
  const { field, operator, value } = rule;
  const f = `\`${field}\``;

  const quote = (v: unknown) =>
    typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v);

  switch (operator) {
    case "equals":             return `${f} = ${quote(value)}`;
    case "not_equals":         return `${f} != ${quote(value)}`;
    case "contains":           return `${f} LIKE '%${value}%'`;
    case "not_contains":       return `${f} NOT LIKE '%${value}%'`;
    case "starts_with":        return `${f} LIKE '${value}%'`;
    case "ends_with":          return `${f} LIKE '%${value}'`;
    case "greater_than":       return `${f} > ${value}`;
    case "less_than":          return `${f} < ${value}`;
    case "greater_than_or_equal": return `${f} >= ${value}`;
    case "less_than_or_equal": return `${f} <= ${value}`;
    case "is_null":            return `${f} IS NULL`;
    case "is_not_null":        return `${f} IS NOT NULL`;
    case "regex":              return `${f} REGEXP '${value}'`;
    case "between": {
      const [a, b] = Array.isArray(value) ? value : [value, value];
      return `${f} BETWEEN ${a} AND ${b}`;
    }
    case "in_array": {
      const vals = Array.isArray(value) ? value : String(value).split(",").map((v) => v.trim());
      return `${f} IN (${vals.map(quote).join(", ")})`;
    }
    case "not_in_array": {
      const vals = Array.isArray(value) ? value : String(value).split(",").map((v) => v.trim());
      return `${f} NOT IN (${vals.map(quote).join(", ")})`;
    }
    default: return `${f} = ${quote(value)}`;
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

function ruleToMongo(rule: QueryRule): Record<string, unknown> {
  const { field, operator, value } = rule;

  const numVal = typeof value === "string" ? parseFloat(value) || value : value;

  switch (operator) {
    case "equals":             return { [field]: value };
    case "not_equals":         return { [field]: { $ne: value } };
    case "contains":           return { [field]: { $regex: value, $options: "i" } };
    case "not_contains":       return { [field]: { $not: { $regex: value, $options: "i" } } };
    case "starts_with":        return { [field]: { $regex: `^${value}` } };
    case "ends_with":          return { [field]: { $regex: `${value}$` } };
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
      const vals = Array.isArray(value) ? value : String(value).split(",").map((v) => v.trim());
      return { [field]: { $in: vals } };
    }
    case "not_in_array": {
      const vals = Array.isArray(value) ? value : String(value).split(",").map((v) => v.trim());
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

function ruleToGQL(rule: QueryRule): string {
  const { field, operator, value } = rule;
  const quoted = typeof value === "string" ? `"${value}"` : String(value);

  switch (operator) {
    case "equals":             return `${field}: { eq: ${quoted} }`;
    case "not_equals":         return `${field}: { neq: ${quoted} }`;
    case "contains":           return `${field}: { ilike: "%${value}%" }`;
    case "starts_with":        return `${field}: { startsWith: "${value}" }`;
    case "ends_with":          return `${field}: { endsWith: "${value}" }`;
    case "greater_than":       return `${field}: { gt: ${value} }`;
    case "less_than":          return `${field}: { lt: ${value} }`;
    case "greater_than_or_equal": return `${field}: { gte: ${value} }`;
    case "less_than_or_equal": return `${field}: { lte: ${value} }`;
    case "is_null":            return `${field}: { isNull: true }`;
    case "is_not_null":        return `${field}: { isNull: false }`;
    case "between": {
      const [a, b] = Array.isArray(value) ? value : [value, value];
      return `${field}: { gte: ${a}, lte: ${b} }`;
    }
    case "in_array": {
      const vals = Array.isArray(value) ? value : String(value).split(",").map((v) => v.trim());
      return `${field}: { in: [${vals.map((v) => `"${v}"`).join(", ")}] }`;
    }
    default: return `${field}: { eq: ${quoted} }`;
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