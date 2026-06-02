# Blanc.

Blanc is a visual query builder built with Next.js App Router and TypeScript. It lets users compose schema-aware filters, nest AND/OR logic, preview generated query syntax, and execute the query against mock datasets without writing raw SQL, MongoDB, or GraphQL filters by hand.

## Submission Links

- [Repo Link](https://github.com/odielijah/blanc_canvas)
- [Live deployment URL](https://blanc-canvas-b1kn.vercel.app/)

<img width="1680" height="1050" alt="Screenshot 2026-06-02 at 5 57 04 pm" src="https://github.com/user-attachments/assets/7b80ba8d-d7fd-4916-a802-c927d1bffbe0" />
<img width="1680" height="1050" alt="Screenshot 2026-06-02 at 5 57 19 pm" src="https://github.com/user-attachments/assets/6d2ec726-0834-4157-b1a4-bbdcac116b6a" />
<img width="1680" height="1050" alt="Screenshot 2026-06-02 at 6 02 26 pm" src="https://github.com/user-attachments/assets/58858c2c-802e-48c3-a47f-ac76bd384053" />


## Features

- Recursive condition groups with unlimited nesting, collapsible sections, and AND/OR logic.
- Visual rule editing with field selector, operator selector, and value input.
- Schema-driven controls for strings, numbers, dates, booleans, and enums.
- Operator restrictions by field type, including equals, not equals, contains, starts with, greater than, less than, between, in list, null checks, and regex.
- Live query preview for SQL-like syntax, Mongo-style query objects, and GraphQL filters.
- Simulated query execution against Users, Products, and Orders datasets.
- Result count, loading states, empty states, and pagination.
- Drag-and-drop reordering for rules and nested groups.
- Query history, saved presets, reset, export/import JSON, and theme switching.
- Recursive validation for query rules, empty strict-mode groups, imported JSON, invalid operators, dates, numbers, ranges, and regex values.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Zustand with Immer middleware
- DnD Kit
- Tailwind CSS
- Vitest

## Architecture

The app is organized by feature under `src/features/query-builder`, with shared query types in `src/shared/types`. The main feature is split into focused layers:

- `components`: recursive UI, toolbar, preview, and results panel.
- `store`: persistent Zustand store and immutable query tree operations.
- `lib`: query generation, query execution, schema definitions, and validators.
- `theme`: local theme configuration.

The query tree uses two node types:

```ts
type QueryNode = QueryRule | QueryGroup;
```

A `QueryGroup` owns a `logic` value and a list of children, where each child can be another group or a rule. This makes nested filters a natural tree instead of a flat list with special cases.

## Recursive Rendering Strategy

`ConditionGroup` renders a group header and then maps over its children. Rule children render as `ConditionRule`; group children call `ConditionGroup` again with an incremented depth. This keeps the UI model aligned with the query model and allows deep nesting without hard-coded levels.

Each group owns its own sortable context for direct children. Rules and nested groups are both sortable, so users can reorder mixed condition/group lists inside the same parent group.

## State Management Decisions

State lives in a single Zustand store:

- `root`: current query tree.
- `schemaId`: active dataset/schema.
- `format`: active preview format.
- `history`: recent query snapshots.
- `presets`: saved named query trees.

Tree updates use Immer so operations can stay readable while still producing immutable state changes. The store exposes focused actions such as `addRule`, `addGroup`, `updateRule`, `removeRule`, `reorderChildren`, `savePreset`, `loadPreset`, `importQuery`, and `exportQuery`.

History snapshots are captured before meaningful mutations so users can recover previous query states.

## Query Engine Design

The query engine traverses the same recursive tree used by the UI:

- SQL generation emits a `SELECT * FROM` query with nested groups wrapped in parentheses.
- Mongo generation emits `$and` and `$or` arrays for multi-rule groups.
- GraphQL generation emits a filter object with equivalent operator names.

Incomplete draft rules are skipped in previews, while strict execution validation prevents incomplete queries from running.

## Validation And Safety

Validation is split into two modes:

- Draft validation allows incomplete values while users are still editing.
- Strict validation requires complete values before execution.

The validation engine checks unknown fields, incompatible operators, empty strict-mode groups, invalid numbers, invalid dates, invalid ranges, and invalid regex patterns. Imported JSON is structurally validated recursively before it can replace the current tree, including node type checks, duplicate ID checks, maximum depth, maximum node count, and supported operator checks.

Generated query strings are intended for preview and simulation, not direct database execution.

## Performance Notes

- Recursive components are memoized where useful.
- Expensive derived values such as validation results and query previews use `useMemo`.
- Tree operations update only the targeted branch through the central store.
- Result execution is paginated to keep table rendering bounded.
- Stable node IDs keep recursive rendering and drag-and-drop behavior predictable.

## Trade-Offs

- The datasets are mocked locally to keep the challenge frontend-focused.
- Query generation favors readable preview syntax over dialect-perfect SQL, MongoDB, or GraphQL compatibility.
- Import validation checks structure and supported operators, while schema-specific field validation happens through the normal query validation engine after import.
- Virtualization and sorting are not currently implemented; pagination is used for result scale.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Test Coverage

Vitest covers query generation, execution, validation behavior, recursive edge cases, import validation, and query-store history/reordering behavior.

Current local checks:

- `npm test`
- `npm run lint`
- `npm run build`

## Deployment

The project is ready for Vercel or Netlify deployment as a standard Next.js App Router app. For the challenge submission, connect the GitHub repository to Vercel or Netlify, enable automatic deployments from pull requests, and add the production URL in the submission links above.
