import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import {
  QueryGroup,
  QueryRule,
  QueryNode,
  QueryState,
  LogicOperator,
  QueryFormat,
} from "@/shared/types/query";
import { isImportedQueryGroup } from "@/features/query-builder/lib/validators";

// ── helpers ──────────────────────────────────────────────────────────────────

function findNode(group: QueryGroup, id: string): QueryNode | null {
  if (group.id === id) return group;
  for (const child of group.children) {
    if (child.id === id) return child;
    if (child.type === "group") {
      const found = findNode(child as QueryGroup, id);
      if (found) return found;
    }
  }
  return null;
}

function removeNode(group: QueryGroup, id: string): boolean {
  const idx = group.children.findIndex((c) => c.id === id);
  if (idx !== -1) {
    group.children.splice(idx, 1);
    return true;
  }
  for (const child of group.children) {
    if (child.type === "group") {
      if (removeNode(child as QueryGroup, id)) return true;
    }
  }
  return false;
}

function makeRule(fieldName: string): QueryRule {
  return {
    id: nanoid(8),
    type: "rule",
    field: fieldName,
    operator: "equals",
    value: "",
  };
}

function makeGroup(logic: LogicOperator = "AND"): QueryGroup {
  return {
    id: nanoid(8),
    type: "group",
    logic,
    children: [],
    collapsed: false,
  };
}

// ── store types ───────────────────────────────────────────────────────────────

interface QueryStore extends QueryState {
  // schema / format
  setSchema: (schemaId: string, firstField: string) => void;
  setFormat: (format: QueryFormat) => void;

  // group ops
  addGroup: (parentId: string, logic?: LogicOperator) => void;
  removeGroup: (groupId: string) => void;
  setGroupLogic: (groupId: string, logic: LogicOperator) => void;
  toggleGroupCollapsed: (groupId: string) => void;

  // rule ops
  addRule: (parentId: string, fieldName: string) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (
    ruleId: string,
    patch: Partial<Pick<QueryRule, "field" | "operator" | "value">>,
  ) => void;

  // reorder
  reorderChildren: (
    groupId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;

  // history / presets
  pushHistory: () => void;
  restoreHistory: (index: number) => void;
  savePreset: (name: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;

  // import / export
  importQuery: (json: string) => void;
  exportQuery: () => string;

  // reset
  reset: (firstField: string) => void;
}

// ── initial state ─────────────────────────────────────────────────────────────

const initialRoot = (): QueryGroup => ({
  id: "root",
  type: "group",
  logic: "AND",
  children: [],
  collapsed: false,
});

// ── store ─────────────────────────────────────────────────────────────────────

export const useQueryStore = create<QueryStore>()(
  persist(
    immer((set, get) => ({
      root: initialRoot(),
      schemaId: "users",
      format: "sql",
      history: [],
      presets: [],

      setSchema: (schemaId, firstField) => {
        set((s) => {
          s.schemaId = schemaId;
          s.root = initialRoot();
          s.root.children.push(makeRule(firstField));
        });
      },

      setFormat: (format) =>
        set((s) => {
          s.format = format;
        }),

      addGroup: (parentId, logic = "AND") =>
        set((s) => {
          const parent = findNode(s.root, parentId) as QueryGroup | null;
          if (parent && parent.type === "group") {
            parent.children.push(makeGroup(logic));
          }
        }),

      removeGroup: (groupId) =>
        set((s) => {
          removeNode(s.root, groupId);
        }),

      setGroupLogic: (groupId, logic) =>
        set((s) => {
          const node = findNode(s.root, groupId) as QueryGroup | null;
          if (node?.type === "group") node.logic = logic;
        }),

      toggleGroupCollapsed: (groupId) =>
        set((s) => {
          const node = findNode(s.root, groupId) as QueryGroup | null;
          if (node?.type === "group") node.collapsed = !node.collapsed;
        }),

      addRule: (parentId, fieldName) =>
        set((s) => {
          const parent = findNode(s.root, parentId) as QueryGroup | null;
          if (parent?.type === "group") {
            parent.children.push(makeRule(fieldName));
          }
        }),

      removeRule: (ruleId) =>
        set((s) => {
          removeNode(s.root, ruleId);
        }),

      updateRule: (ruleId, patch) =>
        set((s) => {
          const node = findNode(s.root, ruleId) as QueryRule | null;
          if (node?.type === "rule") {
            Object.assign(node, patch);
            // if field changed, reset operator/value
            if (patch.field !== undefined) {
              node.operator = "equals";
              node.value = "";
            }
          }
        }),

      reorderChildren: (groupId, fromIndex, toIndex) =>
        set((s) => {
          const node = findNode(s.root, groupId) as QueryGroup | null;
          if (!node || node.type !== "group") return;
          const children = node.children;
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= children.length ||
            toIndex >= children.length
          ) {
            return;
          }
          const [item] = children.splice(fromIndex, 1);
          children.splice(toIndex, 0, item);
        }),

      pushHistory: () =>
        set((s) => {
          const snapshot = JSON.parse(JSON.stringify(s.root));
          s.history.unshift(snapshot);
          if (s.history.length > 20) s.history.pop();
        }),

      restoreHistory: (index) =>
        set((s) => {
          const snapshot = s.history[index];
          if (snapshot) s.root = JSON.parse(JSON.stringify(snapshot));
        }),

      savePreset: (name) =>
        set((s) => {
          s.presets.push({
            id: nanoid(8),
            name,
            query: JSON.parse(JSON.stringify(s.root)),
          });
        }),

      loadPreset: (presetId) =>
        set((s) => {
          const preset = s.presets.find((p) => p.id === presetId);
          if (preset) s.root = JSON.parse(JSON.stringify(preset.query));
        }),

      deletePreset: (presetId) =>
        set((s) => {
          s.presets = s.presets.filter((p) => p.id !== presetId);
        }),

      importQuery: (json) =>
        set((s) => {
          try {
            const parsed = JSON.parse(json);
            if (isImportedQueryGroup(parsed)) {
              s.root = JSON.parse(JSON.stringify(parsed));
            }
          } catch {
            // Invalid JSON is ignored here; callers surface validation errors.
          }
        }),

      exportQuery: () => JSON.stringify(get().root, null, 2),

      reset: (firstField) =>
        set((s) => {
          s.root = initialRoot();
          s.root.children.push(makeRule(firstField));
        }),
    })),
    {
      name: "qb-query-store",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ root, schemaId, format, history, presets }) => ({
        root,
        schemaId,
        format,
        history,
        presets,
      }),
    },
  ),
);
