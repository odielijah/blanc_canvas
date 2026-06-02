# Blanc.

Blanc is a visual query builder built with Next.js. It lets you compose nested filter rules, preview the generated query in multiple formats, and run the query against local mock data.

## Features

- Build nested `AND` / `OR` condition groups with drag-and-drop ordering.
- Choose from bundled `Users`, `Products`, and `Orders` schemas.
- Generate live query previews for SQL, MongoDB, and GraphQL.
- Run filters against mock data and inspect paginated results.
- Save presets, restore history, import/export query JSON, and persist the active query across page refreshes.
- Switch between built-in themes.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand with Immer
- dnd-kit
- Vitest

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

```bash
npm run dev        # Start the local dev server
npm run build      # Create a production build
npm run start      # Start the production server
npm run lint       # Run ESLint
npm test           # Run the test suite once
npm run test:watch # Run tests in watch mode
```

## Project Structure

```text
src/app/
  layout.tsx                 # App shell metadata, font, and theme bootstrap
  page.tsx                   # Main page entry
  globals.css                # Global styles and theme tokens

src/features/query-builder/
  components/                # Query builder UI panels and controls
  lib/queryEngine.ts         # SQL, MongoDB, and GraphQL query generation
  lib/queryExecutor.ts       # Mock-data query execution
  lib/schema.ts              # Built-in schemas and mock data
  lib/validators.ts          # Query validation
  store/queryStore.ts        # Zustand query state and persistence
  theme/themes.ts            # Theme configuration

src/shared/types/query.ts    # Query, schema, and operator types
src/__tests__/               # Query engine and executor tests
```

## Query JSON

Queries are represented as a tree of groups and rules. Exported queries can be imported later or edited by hand.

```json
{
  "id": "root",
  "type": "group",
  "logic": "AND",
  "children": [
    {
      "id": "rule-1",
      "type": "rule",
      "field": "age",
      "operator": "greater_than_or_equal",
      "value": "18"
    }
  ],
  "collapsed": false
}
```

## Notes

- The active query state is persisted in browser `localStorage` under `qb-query-store`.
- Theme preference is persisted separately under `qb-theme`.
- Production builds use `next/font` to fetch Bricolage Grotesque from Google Fonts, so the first build needs network access.
