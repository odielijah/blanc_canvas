import {
  QueryGroup,
  QueryRule,
  ValidationError,
  OPERATORS_BY_TYPE,
  DataSchema,
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
    if (
      arr.length === 2 &&
      parseFloat(String(arr[0])) > parseFloat(String(arr[1]))
    ) {
      errors.push({
        nodeId: rule.id,
        message: "First value must be ≤ second value",
      });
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
    if (!parsed || typeof parsed !== "object") {
      return { valid: false, error: "Must be a JSON object" };
    }
    if (parsed.type !== "group") {
      return { valid: false, error: 'Root must have type "group"' };
    }
    if (!Array.isArray(parsed.children)) {
      return { valid: false, error: "Group must have a children array" };
    }
    if (!["AND", "OR"].includes(parsed.logic)) {
      return { valid: false, error: 'Logic must be "AND" or "OR"' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid JSON" };
  }
}
