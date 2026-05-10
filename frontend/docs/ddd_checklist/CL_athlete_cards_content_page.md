# CL: Athlete Cards on Content Page

Design doc: `docs/ddd_design/DES_athlete_cards_content_page.md`
Requirements: `docs/ddd_requirement/REQ_athlete_cards_content_page.md`

---

## Task 1 — Create `AthleteCard` component

**Status:** `completed`  
**Files:** `components/AthleteCard.tsx` (new)  
**Estimated diff:** ~70–80 lines

Create the `AthleteCard` component as a standalone new file. It has no dependencies on the plumbing changes in Task 2 and can be built and reviewed independently.

### What to implement

- Accept `{ athlete: FlatAthlete }` as props (import `FlatAthlete` from `./MapContentSlider` — that export will land in Task 2, so use a local re-declaration here if needed to keep the file compilable before Task 2 merges, or add `// eslint-disable-next-line` for the unresolved import if the type doesn't exist yet).
  - **Preferred approach**: declare a local `interface FlatAthlete { ... }` identical to the one in the design doc inside AthleteCard.tsx, then replace with the import after Task 2 lands.
- **Image area**: render `next/image` `<Image>` when `athlete.thumbnail` is non-empty; maintain `imgError` state (`useState(false)`) and set it `true` via `onError`; when `thumbnail` is empty or `imgError` is true, render an initials `<div>` instead. Both share the same fixed square size (e.g. 80×80 px or full-width aspect-square).
- **Initials fallback**: first letter of `first_name` + first letter of `last_name`, uppercase, centered in a `bg-[#1e293b] rounded-xl` square.
- **Medal row**: derive non-zero medals via `.filter(m => m.count > 0)` from `[{ key:'gold', icon:'🥇', count: athlete.medals.gold }, ...]`; render `<span>icon count</span>` per medal; render nothing for no-medal athletes.
- **Card shell**: `bg-[#1e293b] border border-[#334155] rounded-xl p-3 flex flex-col gap-2`.
- **Text fields**: name in `text-[#e2e8f0]`, city and sports in `text-[#94a3b8] text-sm`.

---

## Task 2 — Data plumbing + ContentPage grid

**Status:** `completed`  
**Files:** `components/MapContentSlider.tsx`, `components/MapWithFilter.tsx`, `components/ContentPage.tsx`  
**Estimated diff:** ~75–90 lines across three files  
**Depends on:** Task 1 (AthleteCard must exist before ContentPage renders it)

Wire the filtered athlete data from `MapWithFilter` up through `MapContentSlider` and down into `ContentPage`, then build the card grid.

### `components/MapContentSlider.tsx`

- Export `FlatAthlete` interface (same shape as in the design doc).
- Add `'use client'` if not already present (it is — the file already has it).
- Add `filteredAthletes` state: `const [filteredAthletes, setFilteredAthletes] = useState<FlatAthlete[]>([])`.
- Pass `onFilteredChange={setFilteredAthletes}` to `<MapWithFilter>`.
- Pass `athletes={filteredAthletes}` to `<ContentPage>`.

### `components/MapWithFilter.tsx`

- Import `FlatAthlete` from `./MapContentSlider`.
- Add `onFilteredChange?: (athletes: FlatAthlete[]) => void` to the props destructuring and `{ cities, onContentPage, onFilteredChange }`.
- Add a `useEffect` after the `filtered` derivation (line ~243 in current file):

```ts
useEffect(() => {
  if (!onFilteredChange) return
  onFilteredChange(
    filtered.flatMap(c =>
      c.athletes.map(a => ({
        first_name: a.first_name,
        last_name: a.last_name,
        city: c.city,
        sports: a.sports,
        medals: a.medals,
        thumbnail: a.thumbnail,
      }))
    )
  )
}, [filtered]) // eslint-disable-line react-hooks/exhaustive-deps
```

### `components/ContentPage.tsx`

- Replace the local `FlatAthlete` stub (from Task 1) with the real import: `import type { FlatAthlete } from './MapContentSlider'`.
- Add `athletes: FlatAthlete[]` to props alongside existing `onMapPage`.
- Import `AthleteCard` from `./AthleteCard`.
- Replace the stub body with:
  - Fixed-height back-button row (matches existing `h-[52px]` style).
  - Scrollable card grid when `athletes.length > 0`: `flex-1 overflow-y-auto` wrapper + `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4` inner div.
  - Empty state when `athletes.length === 0`: centered `text-[#71717A] text-sm` message "No athletes match the current filters."
- Mark file `'use client'`.
