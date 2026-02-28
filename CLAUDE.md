# CLAUDE.md — Line Helper

## Project overview

Line Helper is a Next.js 14 (App Router) application for ice-hockey coaches. It reads per-skater goal events from a CSV file, computes each player's plus/minus, and suggests ranked LW-C-RW line combinations for a given attending roster.

## Repository layout

```
line-helper/
├── data/
│   └── players.csv          # Goal-event log (append-only source of truth)
├── src/
│   └── app/
│       ├── layout.tsx       # Root layout — sets <html>, metadata
│       ├── page.tsx         # Single-page Server Component: all data + UI logic
│       └── globals.css      # Global styles (plain CSS, no modules)
├── next.config.mjs          # Minimal Next.js config (empty)
├── tsconfig.json            # TypeScript — strict mode, bundler resolution
├── .eslintrc.json           # Extends next/core-web-vitals
└── package.json
```

No API routes, no client components, no external state management.

## Data model

### `data/players.csv`

Columns: `goal_type`, `player`, `position`, `goal_date`

| Field | Values |
|-------|--------|
| `goal_type` | `"for"` or `"against"` |
| `player` | Full name string |
| `position` | `"LW"`, `"C"`, or `"RW"` |
| `goal_date` | `YYYY-MM-DD` |

Each row is one goal event on ice for that player. Append rows to grow the historical record; never mutate existing rows.

### Core TypeScript types (`src/app/page.tsx`)

```ts
type GoalEvent  = { goal_type, player, position, goal_date }
type PlayerStat = { player, position, plus_minus, goals_for, goals_against }
type LineCombo  = { lw, c, rw, plus_minus, score }   // lw/c/rw are PlayerStat
```

## Data pipeline (all in `page.tsx`, runs server-side per request)

1. **`loadGoalData()`** — reads `data/players.csv` with `fs.readFileSync`
2. **`parseCsv()`** — splits on newlines/commas, produces `GoalEvent[]`
3. **`buildPlayerStats()`** — folds events into a `Map<name, PlayerStat>`, computing `plus_minus = goals_for − goals_against`
4. Filter by **`attendingPlayers`** — hardcoded array at the top of `page.tsx`
5. **`buildLineCombos()`** — cartesian product of LW × C × RW from the attending roster, sorted descending by `score`
6. **`scoreLine()`** — currently `score = plus_minus` (trivially equal); modify here to change ranking logic

## Attending roster

`attendingPlayers` is a plain array near the top of `page.tsx`. Edit it before each game to reflect who is actually skating. Only players present in both the CSV and this array appear in the UI.

## Development workflow

```bash
npm install          # install dependencies
npm run dev          # start dev server on http://localhost:3000
npm run build        # production build (also runs type-check)
npm run lint         # ESLint (next/core-web-vitals rules)
```

There is no test suite. The build and lint steps serve as the quality gate.

## Key conventions

- **Server Component only.** `page.tsx` has no `"use client"` directive. All data loading uses Node `fs`/`path` — do not move data fetching into client components.
- **Plain CSS.** Styles live in `globals.css` as utility-style class names (`.section`, `.card`, `.table`, `.tag`, `.score-pill`, etc.). Do not introduce CSS Modules, Tailwind, or CSS-in-JS.
- **Strict TypeScript.** `strict: true` is set. Avoid `any`; use the existing types or extend them. Path alias `@/*` maps to `./src/*`.
- **No abstraction layers yet.** The app is intentionally small. Keep data parsing, stat computation, and rendering in `page.tsx` unless the file grows large enough to warrant splitting. If splitting, place helpers in `src/lib/` and keep the page lean.
- **CSV is append-only.** Treat `players.csv` like a ledger. Add new events at the bottom; do not rewrite history.
- **Scoring is a single function.** `scoreLine(plusMinus)` in `page.tsx` is the only place that converts stats into a rank score. Extending the scoring model means adding parameters to this function and updating `buildLineCombos` to pass them.

## Extending the app

| Goal | Where to change |
|------|-----------------|
| Change line-scoring formula | `scoreLine()` in `page.tsx` |
| Add a new stat column (e.g. assists) | New column in CSV → update `GoalEvent` → update `buildPlayerStats` → update the table in JSX |
| Support multiple positions per line (e.g. two centers) | `buildLineCombos()` — change filtering/grouping logic |
| Add a second page | Create `src/app/<route>/page.tsx`; share stat helpers via `src/lib/` |
| Add persistence / editing UI | Introduce an API route (`src/app/api/`) and client components |

## Toolchain versions

| Tool | Version |
|------|---------|
| Node | per `.nvmrc` or system default |
| Next.js | 14.2.5 |
| React | 18.3.1 |
| TypeScript | 5.5.4 |
| ESLint | 8.57.0 |
