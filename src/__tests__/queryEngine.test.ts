import { describe, it, expect } from "vitest";
import {
  generateGraphQL,
  generateSQL,
  generateMongo,
} from "@/features/query-builder/lib/queryEngine";
import {
  validateImportedJSON,
  validateQuery,
} from "@/features/query-builder/lib/validators";
import { QueryGroup, QueryRule } from "@/shared/types/query";
import { SCHEMAS } from "@/features/query-builder/lib/schema";

const usersSchema = SCHEMAS.find((s) => s.id === "users")!;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRule(overrides: Partial<QueryRule> = {}): QueryRule {
  return {
    id: "r1",
    type: "rule",
    field: "age",
    operator: "greater_than",
    value: "18",
    ...overrides,
  };
}

function makeGroup(overrides: Partial<QueryGroup> = {}): QueryGroup {
  return {
    id: "root",
    type: "group",
    logic: "AND",
    children: [],
    ...overrides,
  };
}

// ── SQL Generator ──────────────────────────────────────────────────────────

describe("generateSQL", () => {
  it("generates SELECT * for empty group", () => {
    const sql = generateSQL(makeGroup(), "users");
    expect(sql).toBe("SELECT * FROM `users`");
  });

  it("generates simple WHERE clause", () => {
    const group = makeGroup({ children: [makeRule()] });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("WHERE `age` > 18");
  });

  it("joins multiple rules with AND", () => {
    const group = makeGroup({
      logic: "AND",
      children: [
        makeRule({
          id: "r1",
          field: "age",
          operator: "greater_than",
          value: "18",
        }),
        makeRule({
          id: "r2",
          field: "status",
          operator: "equals",
          value: "active",
        }),
      ],
    });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("AND");
    expect(sql).toContain("`age` > 18");
    expect(sql).toContain("`status` = 'active'");
  });

  it("joins multiple rules with OR", () => {
    const group = makeGroup({
      logic: "OR",
      children: [
        makeRule({ id: "r1" }),
        makeRule({
          id: "r2",
          field: "name",
          operator: "contains",
          value: "test",
        }),
      ],
    });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("OR");
  });

  it("handles BETWEEN operator", () => {
    const group = makeGroup({
      children: [makeRule({ operator: "between", value: ["10", "30"] })],
    });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("BETWEEN 10 AND 30");
  });

  it("handles IN operator", () => {
    const group = makeGroup({
      children: [
        makeRule({
          field: "status",
          operator: "in_array",
          value: "active,pending",
        }),
      ],
    });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("IN (");
    expect(sql).toContain("'active'");
    expect(sql).toContain("'pending'");
  });

  it("handles IS NULL operator", () => {
    const group = makeGroup({
      children: [makeRule({ operator: "is_null", value: null })],
    });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("IS NULL");
  });

  it("escapes single quotes in string values", () => {
    const group = makeGroup({
      children: [
        makeRule({ field: "name", operator: "equals", value: "O'Brien" }),
      ],
    });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("O''Brien");
  });

  it("escapes single quotes in LIKE pattern values", () => {
    const group = makeGroup({
      children: [
        makeRule({ field: "name", operator: "contains", value: "O'Brien" }),
      ],
    });
    const sql = generateSQL(group, "users");
    expect(sql).toContain("LIKE '%O''Brien%'");
  });

  it("generates nested groups with parentheses", () => {
    const nested = makeGroup({
      id: "nested",
      logic: "OR",
      children: [
        makeRule({
          id: "r2",
          field: "status",
          operator: "equals",
          value: "active",
        }),
      ],
    });
    const root = makeGroup({
      children: [makeRule(), nested],
    });
    const sql = generateSQL(root, "users");
    expect(sql).toContain("(");
    expect(sql).toContain(")");
  });
});

// ── Mongo Generator ────────────────────────────────────────────────────────

describe("generateMongo", () => {
  it("returns {} for empty group", () => {
    const result = JSON.parse(generateMongo(makeGroup()));
    expect(result).toEqual({});
  });

  it("generates simple field condition", () => {
    const group = makeGroup({
      children: [makeRule({ operator: "equals", value: "25" })],
    });
    const result = JSON.parse(generateMongo(group));
    expect(result.age).toBe("25");
  });

  it("uses $gt for greater_than", () => {
    const group = makeGroup({ children: [makeRule()] });
    const result = JSON.parse(generateMongo(group));
    expect(result.age.$gt).toBeDefined();
  });

  it("uses $and for AND group with multiple rules", () => {
    const group = makeGroup({
      logic: "AND",
      children: [
        makeRule({ id: "r1" }),
        makeRule({
          id: "r2",
          field: "name",
          operator: "contains",
          value: "test",
        }),
      ],
    });
    const result = JSON.parse(generateMongo(group));
    expect(result.$and).toBeInstanceOf(Array);
    expect(result.$and.length).toBe(2);
  });

  it("uses $or for OR group", () => {
    const group = makeGroup({
      logic: "OR",
      children: [
        makeRule({ id: "r1" }),
        makeRule({
          id: "r2",
          field: "status",
          operator: "equals",
          value: "active",
        }),
      ],
    });
    const result = JSON.parse(generateMongo(group));
    expect(result.$or).toBeInstanceOf(Array);
  });

  it("handles contains with $regex", () => {
    const group = makeGroup({
      children: [
        makeRule({ field: "name", operator: "contains", value: "john" }),
      ],
    });
    const result = JSON.parse(generateMongo(group));
    expect(result.name.$regex).toBe("john");
  });

  it("escapes regex syntax for literal contains filters", () => {
    const group = makeGroup({
      children: [
        makeRule({ field: "name", operator: "contains", value: "a.b*" }),
      ],
    });
    const result = JSON.parse(generateMongo(group));
    expect(result.name.$regex).toBe("a\\.b\\*");
  });
});

// ── GraphQL Generator ─────────────────────────────────────────────────────

describe("generateGraphQL", () => {
  it("escapes string values as GraphQL literals", () => {
    const group = makeGroup({
      children: [
        makeRule({
          field: "name",
          operator: "equals",
          value: 'Ada "Ace"',
        }),
      ],
    });
    const gql = generateGraphQL(group, "users");
    expect(gql).toContain('name: { eq: "Ada \\"Ace\\"" }');
  });
});

// ── Validation Engine ──────────────────────────────────────────────────────

describe("validateQuery", () => {
  it("returns no errors for valid rule", () => {
    const group = makeGroup({ children: [makeRule()] });
    const errors = validateQuery(group, usersSchema);
    expect(errors).toHaveLength(0);
  });

  it("treats empty value rules as drafts", () => {
    const group = makeGroup({
      children: [makeRule({ operator: "equals", value: "" })],
    });
    const errors = validateQuery(group, usersSchema);
    expect(errors).toHaveLength(0);
  });

  it("requires empty value rules in strict mode", () => {
    const group = makeGroup({
      children: [makeRule({ operator: "equals", value: "" })],
    });
    const errors = validateQuery(group, usersSchema, { requireComplete: true });
    expect(errors.some((e) => e.message === "Value is required")).toBe(true);
  });

  it("returns no error for is_null with no value", () => {
    const group = makeGroup({
      children: [makeRule({ operator: "is_null", value: null })],
    });
    const errors = validateQuery(group, usersSchema);
    expect(errors).toHaveLength(0);
  });

  it("flags invalid operator for field type", () => {
    // 'contains' is not valid for number fields
    const group = makeGroup({
      children: [
        makeRule({ field: "age", operator: "contains", value: "test" }),
      ],
    });
    const errors = validateQuery(group, usersSchema);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("not valid for field type");
  });

  it("flags non-numeric value for number field", () => {
    const group = makeGroup({
      children: [
        makeRule({ field: "age", operator: "equals", value: "notanumber" }),
      ],
    });
    const errors = validateQuery(group, usersSchema);
    expect(errors.some((e) => e.message.includes("number"))).toBe(true);
  });

  it("treats empty nested groups as drafts", () => {
    const nested = makeGroup({ id: "nested" });
    const root = makeGroup({ children: [nested] });
    const errors = validateQuery(root, usersSchema);
    expect(errors).toHaveLength(0);
  });

  it("requires empty nested groups in strict mode", () => {
    const nested = makeGroup({ id: "nested" });
    const root = makeGroup({ children: [nested] });
    const errors = validateQuery(root, usersSchema, { requireComplete: true });
    expect(errors.some((e) => e.nodeId === "nested")).toBe(true);
  });

  it("flags between with min > max", () => {
    const group = makeGroup({
      children: [makeRule({ operator: "between", value: ["50", "10"] })],
    });
    const errors = validateQuery(group, usersSchema);
    expect(errors.some((e) => e.message.includes("≤"))).toBe(true);
  });

  it("flags date between ranges in the wrong order", () => {
    const group = makeGroup({
      children: [
        makeRule({
          field: "createdAt",
          operator: "between",
          value: ["2024-06-01", "2024-01-01"],
        }),
      ],
    });
    const errors = validateQuery(group, usersSchema);
    expect(errors.some((e) => e.message.includes("≤"))).toBe(true);
  });
});

// ── Import Validation ─────────────────────────────────────────────────────

describe("validateImportedJSON", () => {
  it("accepts a valid nested query tree", () => {
    const result = validateImportedJSON(
      JSON.stringify({
        id: "root",
        type: "group",
        logic: "AND",
        children: [
          {
            id: "nested",
            type: "group",
            logic: "OR",
            children: [
              {
                id: "r1",
                type: "rule",
                field: "name",
                operator: "contains",
                value: "Ada",
              },
            ],
          },
        ],
      }),
    );

    expect(result.valid).toBe(true);
  });

  it("rejects malformed nested child nodes", () => {
    const result = validateImportedJSON(
      JSON.stringify({
        id: "root",
        type: "group",
        logic: "AND",
        children: [{ id: "bad", type: "group", logic: "AND" }],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.error).toContain("children array");
  });

  it("rejects unsupported imported operators", () => {
    const result = validateImportedJSON(
      JSON.stringify({
        id: "root",
        type: "group",
        logic: "AND",
        children: [
          {
            id: "r1",
            type: "rule",
            field: "name",
            operator: "$where",
            value: "true",
          },
        ],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.error).toContain("operator");
  });
});
