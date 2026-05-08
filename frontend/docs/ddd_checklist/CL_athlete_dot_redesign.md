# CL: Athlete Dot Redesign on US Map

**Design:** `docs/ddd_design/DES_athlete_dot_redesign.md`
**Requirements:** `docs/ddd_requirement/REQ_athlete_dot_redesign.md`

---

## Tasks

### Task 1 — Foundations: tier table, helper, interface, and SVG filters `[ completed ]`

**Files:** `components/UsMap.tsx`

**What:**
- Add `DOT_TIERS` constant (5-entry lookup table with glow/dot/core sizes and blur values)
- Add `getTierIndex(athleteCount: number): number` pure function
- Extend `StateCityEntry` interface with `athleteCount?: number`
- Remove dead `activeCity` useState and all its references (class attr, conditional radius/fill on old circles)
- Inject SVG `<defs>` block into the `useEffect` render pass with 15 filters:
  - 5 glow filters (`glow-t1..t5`): `feGaussianBlur` stdDeviation 6/8/10/12/14
  - 5 cyan shadow filters (`shadow-cyan-t1..t5`): `feDropShadow` color `#06B6D4`, stdDeviation 5/6/7/8/9
  - 5 red shadow filters (`shadow-red-t1..t5`): `feDropShadow` color `#EF4444`, stdDeviation 5/6/7/8/9

**Dependency:** none — first task, all additions + dead code removal  
**Estimated diff:** ~80 lines

---

### Task 2 — Replace athlete city dot rendering with 3-layer groups `[ completed ]`

**Files:** `components/UsMap.tsx`

**What:**
- Remove the existing `svg.append('g').selectAll('circle')…` block that draws flat cyan athlete city circles
- Replace with a D3 data-join on `<g>` groups, one per city, translated to the projected coordinate
- Each `<g>` gets three `<ellipse>` children in paint order: glow → dot → core
  - Glow: `rx/ry = DOT_TIERS[tier].glow/2`, fill `#06B6D4`, opacity 0.3, filter `glow-tN`
  - Dot: `rx/ry = DOT_TIERS[tier].dot/2`, fill `#06B6D4`, filter `shadow-cyan-tN`
  - Core: `rx/ry = DOT_TIERS[tier].core/2`, fill `#FFFFFF`, opacity 0.9
- All three ellipses centered at (0,0) within the group (no cx/cy needed)
- Move event handlers (`mouseenter`, `mousemove`, `mouseleave`) from circle to `<g>` — logic unchanged

**Dependency:** Task 1 (needs `DOT_TIERS`, `getTierIndex`, and filters defined)  
**Estimated diff:** ~80 lines

---

### Task 3 — Replace state city dot rendering and enrich data in MapWithFilter `[ completed ]`

**Files:** `components/UsMap.tsx`, `components/MapWithFilter.tsx`

**What (UsMap.tsx):**
- Remove the existing `g.selectAll('circle')` block that draws transparent red-stroke circles for state cities
- Replace with a D3 data-join on `<g>` groups using the same 3-layer pattern but red color scheme:
  - Glow: fill `#EF4444`, filter `glow-tN`
  - Dot: fill `#EF4444`, filter `shadow-red-tN`
  - Core: fill `#FFFFFF`, opacity 0.9
- Tier index derived from `d.athleteCount ?? 0` via `getTierIndex`
- `pointer-events: none` stays on the group (same as today)
- City name labels (`g.selectAll('text')`) remain unchanged

**What (MapWithFilter.tsx):**
- After computing `stateCities`, build a `filteredCityCountMap: Map<string, number>` from `filtered`
- Map `stateCities` to `enrichedStateCities` adding `athleteCount: filteredCityCountMap.get(sc.city) ?? 0`
- Pass `enrichedStateCities` to `<UsMap stateCities=…>` instead of the raw `stateCities`

**Dependency:** Task 1 (needs `StateCityEntry.athleteCount?`, `DOT_TIERS`, `getTierIndex`, and red filters)  
**Estimated diff:** ~80 lines

---

## Completion Checklist

- [x] Task 1 approved
- [x] Task 2 approved
- [x] Task 3 approved
- [x] `npm run build` passes with no errors
