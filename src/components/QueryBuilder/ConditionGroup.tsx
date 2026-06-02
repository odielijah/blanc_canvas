"use client";
import { memo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  QueryGroup as QueryGroupType,
  QueryRule,
  LogicOperator,
  ValidationError,
} from "@/types/query";
import { useQueryStore } from "@/store/queryStore";
import { SCHEMAS } from "@/lib/schema";
import { getError } from "@/lib/validators";
import { ConditionRule } from "./ConditionRule";

interface Props {
  group: QueryGroupType;
  depth?: number;
  errors: ValidationError[];
  isRoot?: boolean;
}

const DEPTH_COLORS = [
  "border-violet-200 dark:border-violet-900/50",
  "border-sky-200 dark:border-sky-900/50",
  "border-emerald-200 dark:border-emerald-900/50",
  "border-amber-200 dark:border-amber-900/50",
  "border-pink-200 dark:border-pink-900/50",
];

const DEPTH_BG = [
  "bg-white dark:bg-zinc-900",
  "bg-violet-50/40 dark:bg-violet-950/10",
  "bg-sky-50/40 dark:bg-sky-950/10",
  "bg-emerald-50/40 dark:bg-emerald-950/10",
  "bg-amber-50/40 dark:bg-amber-950/10",
];

const DEPTH_BADGE = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
];

export const ConditionGroup = memo(function ConditionGroup({
  group,
  depth = 0,
  errors,
  isRoot = false,
}: Props) {
  const {
    schemaId,
    addRule,
    addGroup,
    removeGroup,
    setGroupLogic,
    toggleGroupCollapsed,
    reorderChildren,
  } = useQueryStore();

  const schema = SCHEMAS.find((s) => s.id === schemaId)!;
  const firstField = schema.fields[0].name;
  const colorIdx = Math.min(depth, DEPTH_COLORS.length - 1);
  const error = getError(group.id, errors);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIdx = group.children.findIndex((c) => c.id === active.id);
      const toIdx = group.children.findIndex((c) => c.id === over.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        reorderChildren(group.id, fromIdx, toIdx);
      }
    },
    [group, reorderChildren],
  );

  const childIds = group.children.map((c) => c.id);

  return (
    <div
      className={`
        rounded-xl border transition-all
        ${DEPTH_COLORS[colorIdx]} ${DEPTH_BG[colorIdx]}
        ${error ? "ring-1 ring-red-400 dark:ring-red-700" : ""}
        ${depth > 0 ? "ml-3 sm:ml-6" : ""}
      `}
    >
      {/* Group header */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-inherit">
        {/* Collapse toggle */}
        <button
          onClick={() => toggleGroupCollapsed(group.id)}
          className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
          aria-label={group.collapsed ? "Expand group" : "Collapse group"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${group.collapsed ? "-rotate-90" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Depth badge */}
        {!isRoot && (
          <span
            className={`text-xs font-mono px-1.5 py-0.5 rounded ${DEPTH_BADGE[colorIdx]}`}
          >
            L{depth}
          </span>
        )}
        {isRoot && (
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Where
          </span>
        )}

        {/* Logic toggle */}
        <div className="flex items-center rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 ml-1">
          {(["AND", "OR"] as LogicOperator[]).map((op) => (
            <button
              key={op}
              onClick={() => setGroupLogic(group.id, op)}
              className={`
                px-3 py-1 text-xs font-bold tracking-wider transition-all
                ${
                  group.logic === op
                    ? op === "AND"
                      ? "bg-violet-600 text-white"
                      : "bg-amber-500 text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }
              `}
              aria-pressed={group.logic === op}
            >
              {op}
            </button>
          ))}
        </div>

        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
          {group.children.length}{" "}
          {group.children.length === 1 ? "condition" : "conditions"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          {/* Add rule */}
          <button
            onClick={() => addRule(group.id, firstField)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Rule
          </button>

          {/* Add nested group */}
          <button
            onClick={() => addGroup(group.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <line x1="20" y1="17" x2="20" y2="21" />
              <line x1="18" y1="19" x2="22" y2="19" />
            </svg>
            Group
          </button>

          {/* Remove group (not root) */}
          {!isRoot && (
            <button
              onClick={() => removeGroup(group.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label="Remove group"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {!group.collapsed && (
        <div className="p-2.5 flex flex-col gap-1.5">
          {group.children.length === 0 ? (
            <div className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500 italic">
              No conditions yet — add a rule or nested group
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={childIds}
                strategy={verticalListSortingStrategy}
              >
                {group.children.map((child) =>
                  child.type === "rule" ? (
                    <ConditionRule
                      key={child.id}
                      rule={child as QueryRule}
                      parentId={group.id}
                      errors={errors}
                    />
                  ) : (
                    <ConditionGroup
                      key={child.id}
                      group={child as QueryGroupType}
                      depth={depth + 1}
                      errors={errors}
                    />
                  ),
                )}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {group.collapsed && group.children.length > 0 && (
        <div className="px-4 py-2 text-xs text-zinc-400 dark:text-zinc-500">
          {group.children.length} condition
          {group.children.length !== 1 ? "s" : ""} hidden
        </div>
      )}

      {error && (
        <div className="px-4 py-1.5 text-xs text-red-500 dark:text-red-400 border-t border-red-200 dark:border-red-900">
          {error}
        </div>
      )}
    </div>
  );
});
