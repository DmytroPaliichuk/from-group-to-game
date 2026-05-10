# CL: Map Header Two-Row Filter Redesign

**Design:** `docs/ddd_design/DES_map_header_two_row_filter.md`
**Requirement:** `docs/ddd_requirement/REQ_map_header_two_row_filter.md`

---

## Tasks

### Task 1 — Add `className` prop to search components and restructure MapWithFilter header

**Status:** `completed`

**Files:**
- `components/AthleteSearch.tsx`
- `components/CitySearch.tsx`
- `components/MapWithFilter.tsx`

**What to do:**

1. **AthleteSearch.tsx** — add optional `className?: string` to `AthleteSearchProps`; apply it to the root div; replace `max-w-[320px]` with `flex-1` on the inner input container.

2. **CitySearch.tsx** — same three changes as AthleteSearch.

3. **MapWithFilter.tsx** — replace the single `div.flex.items-center.h-[52px].gap-8.flex-shrink-0` with two stacked rows:
   - **Row 1** (`flex items-center gap-8 flex-shrink-0 border-b border-[#334155] pb-2`): Game toggle, Season toggle, Medal toggles, Sport dropdown, Content Page button (`ml-auto`). Remove the fixed `h-[52px]`.
   - **Row 2** (`flex gap-4 flex-shrink-0 pt-2`): `<AthleteSearch className="flex-1 min-w-0" .../>` and `<CitySearch className="flex-1 min-w-0" .../>`.

**Acceptance check:** `npm run build` passes with no TypeScript errors. Visually: two rows, thin divider, searches fill equal halves, all filter interactions unchanged.
