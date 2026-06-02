export type FieldType = "string" | "number" | "boolean" | "date" | "enum";

export type Operator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "between"
  | "in_array"
  | "not_in_array"
  | "is_null"
  | "is_not_null"
  | "regex";

export type LogicOperator = "AND" | "OR";

export type QueryFormat = "sql" | "mongo" | "graphql";

export interface FieldSchema {
  name: string;
  label: string;
  type: FieldType;
  enumValues?: string[];
}

export interface DataSchema {
  id: string;
  name: string;
  fields: FieldSchema[];
}

export interface QueryRule {
  id: string;
  type: "rule";
  field: string;
  operator: Operator;
  value: string | number | boolean | string[] | [number, number] | null;
}

export interface QueryGroup {
  id: string;
  type: "group";
  logic: LogicOperator;
  children: (QueryRule | QueryGroup)[];
  collapsed?: boolean;
}

export type QueryNode = QueryRule | QueryGroup;

export interface QueryState {
  root: QueryGroup;
  schemaId: string;
  format: QueryFormat;
  history: QueryGroup[];
  presets: { id: string; name: string; query: QueryGroup }[];
}

export interface ValidationError {
  nodeId: string;
  message: string;
}

export const OPERATORS_BY_TYPE: Record<FieldType, Operator[]> = {
  string: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "is_null",
    "is_not_null",
    "regex",
    "in_array",
  ],
  number: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
    "between",
    "is_null",
    "is_not_null",
  ],
  boolean: ["equals", "is_null", "is_not_null"],
  date: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "between",
    "is_null",
    "is_not_null",
  ],
  enum: [
    "equals",
    "not_equals",
    "in_array",
    "not_in_array",
    "is_null",
    "is_not_null",
  ],
};

export const OPERATOR_LABELS: Record<Operator, string> = {
  equals: "equals",
  not_equals: "≠ not equals",
  contains: "contains",
  not_contains: "not contains",
  starts_with: "starts with",
  ends_with: "ends with",
  greater_than: "> greater than",
  less_than: "< less than",
  greater_than_or_equal: "≥ greater than or equal to",
  less_than_or_equal: "≤ less than or equal to",
  between: "between",
  in_array: "in list",
  not_in_array: "not in list",
  is_null: "is empty",
  is_not_null: "is not empty",
  regex: "matches regex",
};
