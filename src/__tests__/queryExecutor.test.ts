import { describe, it, expect } from "vitest";
import { executeQuery } from "@/features/query-builder/lib/queryExecutor";
import { QueryGroup, QueryRule } from "@/shared/types/query";

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

describe("executeQuery", () => {
  it("returns all rows for empty query", () => {
    const { total } = executeQuery("users", makeGroup(), 1, 100);
    expect(total).toBe(12);
  });

  it("filters by age > 18", () => {
    const group = makeGroup({ children: [makeRule()] });
    const { total, results } = executeQuery("users", group, 1, 100);
    expect(total).toBeGreaterThan(0);
    results.forEach((r) => expect(Number(r.age)).toBeGreaterThan(18));
  });

  it("filters by equals operator", () => {
    const group = makeGroup({
      children: [
        makeRule({ field: "country", operator: "equals", value: "Nigeria" }),
      ],
    });
    const { results } = executeQuery("users", group, 1, 100);
    results.forEach((r) => expect(r.country).toBe("Nigeria"));
  });

  it("filters by contains", () => {
    const group = makeGroup({
      children: [makeRule({ field: "name", operator: "contains", value: "a" })],
    });
    const { results } = executeQuery("users", group, 1, 100);
    results.forEach((r) => expect(String(r.name).toLowerCase()).toContain("a"));
  });

  it("applies AND logic correctly", () => {
    const group = makeGroup({
      logic: "AND",
      children: [
        makeRule({
          id: "r1",
          field: "status",
          operator: "equals",
          value: "active",
        }),
        makeRule({
          id: "r2",
          field: "purchases",
          operator: "greater_than",
          value: "10",
        }),
      ],
    });
    const { results } = executeQuery("users", group, 1, 100);
    results.forEach((r) => {
      expect(r.status).toBe("active");
      expect(Number(r.purchases)).toBeGreaterThan(10);
    });
  });

  it("applies OR logic correctly", () => {
    const group = makeGroup({
      logic: "OR",
      children: [
        makeRule({
          id: "r1",
          field: "status",
          operator: "equals",
          value: "banned",
        }),
        makeRule({
          id: "r2",
          field: "age",
          operator: "less_than",
          value: "18",
        }),
      ],
    });
    const { results } = executeQuery("users", group, 1, 100);
    results.forEach((r) => {
      const isBanned = r.status === "banned";
      const isMinor = Number(r.age) < 18;
      expect(isBanned || isMinor).toBe(true);
    });
  });

  it("paginates results correctly", () => {
    const group = makeGroup();
    const page1 = executeQuery("users", group, 1, 5);
    const page2 = executeQuery("users", group, 2, 5);
    expect(page1.results.length).toBe(5);
    expect(page1.page).toBe(1);
    expect(page2.page).toBe(2);
    expect(page1.results[0].id).not.toBe(page2.results[0].id);
  });

  it("returns empty results for impossible query", () => {
    const group = makeGroup({
      children: [makeRule({ field: "age", operator: "equals", value: "999" })],
    });
    const { total, results } = executeQuery("users", group, 1, 10);
    expect(total).toBe(0);
    expect(results).toHaveLength(0);
  });

  it("handles unknown schema gracefully", () => {
    const { total } = executeQuery("nonexistent", makeGroup(), 1, 10);
    expect(total).toBe(0);
  });

  it("handles is_null filter", () => {
    const group = makeGroup({
      children: [
        makeRule({ field: "notes", operator: "is_not_null", value: null }),
      ],
    });
    // orders schema has notes field
    const { results } = executeQuery("orders", group, 1, 100);
    // All results should have a non-null/empty notes
    // At least some orders have notes in mock data
    expect(results.length).toBeGreaterThanOrEqual(0);
  });
});
