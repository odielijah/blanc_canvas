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
} from "@/shared/types/query";
import { useQueryStore } from "@/features/query-builder/store/queryStore";
import { SCHEMAS } from "@/features/query-builder/lib/schema";
import { getError } from "@/features/query-builder/lib/validators";
import { ConditionRule } from "./ConditionRule";
import { ChevronDownIcon, GroupPlusIcon, PlusIcon, TrashIcon } from "./icons";

interface Props {
  group: QueryGroupType;
  depth?: number;
  errors: ValidationError[];
  isRoot?: boolean;
}

const DEPTH_CLASSES = [
  "condition-group-depth-0",
  "condition-group-depth-1",
  "condition-group-depth-2",
  "condition-group-depth-3",
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
  const colorIdx = Math.min(depth, DEPTH_CLASSES.length - 1);
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
        condition-group rounded-xl transition-all
        ${DEPTH_CLASSES[colorIdx]}
        ${error ? "condition-rule-error ring-1" : ""}
        ${depth > 0 ? "ml-3 sm:ml-6" : ""}
      `}
    >
      {/* Group header */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        {/* Collapse toggle */}
        <button
          onClick={() => toggleGroupCollapsed(group.id)}
          className="ghost-button flex-shrink-0 rounded p-0.5 transition-colors"
          aria-label={group.collapsed ? "Expand group" : "Collapse group"}
        >
          <ChevronDownIcon
            className={`transition-transform duration-200 ${group.collapsed ? "-rotate-90" : ""}`}
          />
        </button>

        {/* Depth badge */}
        {!isRoot && (
          <span
            className="depth-badge rounded px-1.5 py-0.5 font-mono text-xs"
          >
            L{depth}
          </span>
        )}
        {isRoot && (
          <span className="text-muted-theme text-xs font-semibold uppercase tracking-widest">
            Where
          </span>
        )}

        {/* Logic toggle */}
        <div className="segmented-control ml-1 flex items-center">
          {(["AND", "OR"] as LogicOperator[]).map((op) => (
            <button
              key={op}
              onClick={() => setGroupLogic(group.id, op)}
              className={`
                px-3 py-1 text-xs font-bold tracking-wider transition-all
                ${
                  group.logic === op
                    ? "segmented-option-active"
                    : "segmented-option"
                }
              `}
              aria-pressed={group.logic === op}
            >
              {op}
            </button>
          ))}
        </div>

        <span className="text-muted-theme ml-1 text-xs">
          {group.children.length}{" "}
          {group.children.length === 1 ? "condition" : "conditions"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          {/* Add rule */}
          <button
            onClick={() => addRule(group.id, firstField)}
            className="ghost-button flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            <PlusIcon />
            Rule
          </button>

          {/* Add nested group */}
          <button
            onClick={() => addGroup(group.id)}
            className="ghost-button flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            <GroupPlusIcon />
            Group
          </button>

          {/* Remove group (not root) */}
          {!isRoot && (
            <button
              onClick={() => removeGroup(group.id)}
              className="danger-button rounded-lg p-1.5 transition-colors"
              aria-label="Remove group"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {!group.collapsed && (
        <div className="flex flex-col gap-1.5 p-2.5">
          {group.children.length === 0 ? (
            <div className="empty-state py-6 text-center text-sm">
              Add a rule or nested group
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
        <div className="text-muted-theme px-4 py-2 text-xs">
          {group.children.length} condition
          {group.children.length !== 1 ? "s" : ""} hidden
        </div>
      )}

      {error && (
        <div className="danger-panel border-x-0 border-b-0 px-4 py-1.5 text-xs">
          {error}
        </div>
      )}
    </div>
  );
});
