import {
  QueryGroup,
  QueryRule,
  Operator,
  ValidationError,
  OPERATORS_BY_TYPE,
  DataSchema,
  OPERATOR_LABELS,
} from "@/shared/types/query";

interface ValidateQueryOptions {
  requireComplete?: boolean;
}

function validateRule(
  rule: QueryRule,
  schema: DataSchema,
  errors: ValidationError[],
  options: ValidateQueryOptions,
) {
  const field = schema.fields.find((f) => f.name === rule.field);

  if (!rule.field) {
    errors.push({ nodeId: rule.id, message: "Field is required" });
    return;
  }

  if (!field) {
    errors.push({ nodeId: rule.id, message: `Unknown field: ${rule.field}` });
    return;
  }

  const validOps = OPERATORS_BY_TYPE[field.type];
  if (!validOps.includes(rule.operator)) {
    errors.push({
      nodeId: rule.id,
      message: `Operator "${rule.operator}" is not valid for field type "${field.type}"`,
    });
    return;
  }

  const needsValue = !["is_null", "is_not_null"].includes(rule.operator);
  if (
    needsValue &&
    (rule.value === "" || rule.value === null || rule.value === undefined)
  ) {
    if (options.requireComplete) {
      errors.push({ nodeId: rule.id, message: "Value is required" });
    }
    return;
  }

  if (rule.operator === "between") {
    const arr = Array.isArray(rule.value) ? rule.value : [];
    if (arr.length === 0 || (arr[0] === "" && arr[1] === "")) {
      if (options.requireComplete) {
        errors.push({ nodeId: rule.id, message: "Between requires two values" });
      }
      return;
    }
    if (arr.length < 2 || arr[0] === "" || arr[1] === "") {
      errors.push({ nodeId: rule.id, message: "Between requires two values" });
    }
    if (arr.length === 2 && arr[0] !== "" && arr[1] !== "") {
      if (field.type === "date") {
        const start = new Date(String(arr[0]));
        const end = new Date(String(arr[1]));
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          errors.push({
            nodeId: rule.id,
            message: "Between requires valid dates",
          });
        } else if (start.getTime() > end.getTime()) {
          errors.push({
            nodeId: rule.id,
            message: "First value must be ≤ second value",
          });
        }
      } else {
        const start = Number(arr[0]);
        const end = Number(arr[1]);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          errors.push({
            nodeId: rule.id,
            message: "Between requires numeric values",
          });
        } else if (start > end) {
          errors.push({
            nodeId: rule.id,
            message: "First value must be ≤ second value",
          });
        }
      }
    }
  }

  if (field.type === "number" && needsValue && rule.operator !== "between") {
    const n = parseFloat(String(rule.value));
    if (isNaN(n)) {
      errors.push({ nodeId: rule.id, message: "Value must be a number" });
    }
  }

  if (field.type === "date" && needsValue && rule.operator !== "between") {
    const d = new Date(String(rule.value));
    if (isNaN(d.getTime())) {
      errors.push({ nodeId: rule.id, message: "Value must be a valid date" });
    }
  }

  if (rule.operator === "regex") {
    try {
      new RegExp(String(rule.value));
    } catch {
      errors.push({ nodeId: rule.id, message: "Invalid regular expression" });
    }
  }
}

function validateGroup(
  group: QueryGroup,
  schema: DataSchema,
  errors: ValidationError[],
  options: ValidateQueryOptions,
  depth = 0,
) {
  if (options.requireComplete && depth > 0 && group.children.length === 0) {
    errors.push({ nodeId: group.id, message: "Group cannot be empty" });
    return;
  }

  for (const child of group.children) {
    if (child.type === "rule") {
      validateRule(child as QueryRule, schema, errors, options);
    } else {
      validateGroup(child as QueryGroup, schema, errors, options, depth + 1);
    }
  }
}

export function validateQuery(
  root: QueryGroup,
  schema: DataSchema,
  options: ValidateQueryOptions = {},
): ValidationError[] {
  const errors: ValidationError[] = [];
  validateGroup(root, schema, errors, options);
  return errors;
}

export function hasErrors(nodeId: string, errors: ValidationError[]): boolean {
  return errors.some((e) => e.nodeId === nodeId);
}

export function getError(
  nodeId: string,
  errors: ValidationError[],
): string | undefined {
  return errors.find((e) => e.nodeId === nodeId)?.message;
}

export function validateImportedJSON(json: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsed = JSON.parse(json);
    return validateImportedQueryTree(parsed);
  } catch {
    return { valid: false, error: "Invalid JSON" };
  }
}

const VALID_OPERATORS = new Set<Operator>(
  Object.keys(OPERATOR_LABELS) as Operator[],
);
const MAX_IMPORT_DEPTH = 50;
const MAX_IMPORT_NODES = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafeFieldName(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function isValidRuleValue(value: unknown): value is QueryRule["value"] {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  return Array.isArray(value)
    ? value.every((item) => typeof item === "string" || typeof item === "number")
    : false;
}

function validateImportedNode(
  node: unknown,
  seenIds: Set<string>,
  depth: number,
  count: { value: number },
): { valid: boolean; error?: string } {
  if (!isRecord(node)) {
    return { valid: false, error: "Every node must be a JSON object" };
  }

  count.value += 1;
  if (count.value > MAX_IMPORT_NODES) {
    return {
      valid: false,
      error: `Imported query cannot exceed ${MAX_IMPORT_NODES} nodes`,
    };
  }

  if (depth > MAX_IMPORT_DEPTH) {
    return {
      valid: false,
      error: `Imported query cannot exceed ${MAX_IMPORT_DEPTH} levels`,
    };
  }

  if (!isValidId(node.id)) {
    return { valid: false, error: "Every node must have a non-empty id" };
  }

  if (seenIds.has(node.id)) {
    return { valid: false, error: `Duplicate node id: ${node.id}` };
  }
  seenIds.add(node.id);

  if (node.type === "rule") {
    if (!isSafeFieldName(node.field)) {
      return { valid: false, error: "Rule field must be a safe field name" };
    }
    if (typeof node.operator !== "string" || !VALID_OPERATORS.has(node.operator as Operator)) {
      return { valid: false, error: "Rule operator is not supported" };
    }
    if (!isValidRuleValue(node.value)) {
      return { valid: false, error: "Rule value has an unsupported shape" };
    }
    return { valid: true };
  }

  if (node.type === "group") {
    if (!["AND", "OR"].includes(String(node.logic))) {
      return { valid: false, error: 'Group logic must be "AND" or "OR"' };
    }
    if (!Array.isArray(node.children)) {
      return { valid: false, error: "Group must have a children array" };
    }
    if (
      node.collapsed !== undefined &&
      typeof node.collapsed !== "boolean"
    ) {
      return { valid: false, error: "Group collapsed value must be boolean" };
    }

    for (const child of node.children) {
      const result = validateImportedNode(child, seenIds, depth + 1, count);
      if (!result.valid) return result;
    }
    return { valid: true };
  }

  return { valid: false, error: 'Node type must be "group" or "rule"' };
}

export function validateImportedQueryTree(value: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!isRecord(value)) {
    return { valid: false, error: "Must be a JSON object" };
  }
  if (value.type !== "group") {
    return { valid: false, error: 'Root must have type "group"' };
  }

  return validateImportedNode(value, new Set(), 0, { value: 0 });
}

export function isImportedQueryGroup(value: unknown): value is QueryGroup {
  return validateImportedQueryTree(value).valid;
}
