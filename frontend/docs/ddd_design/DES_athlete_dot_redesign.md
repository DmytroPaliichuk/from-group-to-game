# DES: Athlete Dot Redesign on US Map

**Requirements:** `docs/ddd_requirement/REQ_athlete_dot_redesign.md`

---

## Overview

Two files change:
- `components/UsMap.tsx` — replace flat D3 circle rendering with 3-layer SVG group rendering; define SVG `<defs>` filters for glow and drop-shadow
- `components/MapWithFilter.tsx` — enrich `stateCities` with `athleteCount` before passing to `UsMap`

No new files. No new dependencies.

---

## Data Flow

```
MapWithFilter
  │
  ├── filtered: City[]          (athlete cities, already filtered)
  ├── stateCities: from JSON    (top-5 cities per state, no athlete data)
  │
  ├── JOIN: cityName → count from filtered
  │
  └── enrichedStateCities: StateCityEntry[]  (adds athleteCount field)
        │
        v
      UsMap
        ├── renders cyan layered dots for athlete cities
        └── renders red layered dots for state cities
```

---

## Interface Change

`StateCityEntry` gains one optional field in `UsMap.tsx`:

```typescript
interface StateCityEntry {
  city: string
  lat: number
  lng: number
  athleteCount?: number  // 0 or absent → use Size 1
}
```

---

## Tier Lookup Table

Module-level constant in `UsMap.tsx`. Index 0 = Size 1, index 4 = Size 5+.

```typescript
const DOT_TIERS = [
  { glow: 18, dot: 8,  core: 3, glowBlur: 6,  shadowBlur: 5 }, // 1 athlete
  { glow: 24, dot: 10, core: 4, glowBlur: 8,  shadowBlur: 6 }, // 2 athletes
  { glow: 30, dot: 12, core: 5, glowBlur: 10, shadowBlur: 7 }, // 3 athletes
  { glow: 36, dot: 14, core: 6, glowBlur: 12, shadowBlur: 8 }, // 4 athletes
  { glow: 42, dot: 16, core: 7, glowBlur: 14, shadowBlur: 9 }, // 5+ athletes
] as const

function getTierIndex(athleteCount: number): number {
  return Math.min(Math.max(athleteCount - 1, 0), 4)
}
```

---

## SVG Filter Definitions

15 filters added inside `<defs>` in the D3-rendered SVG. They are injected once at the start of the `useEffect` render pass (before drawing states or dots).

### Glow filters (5, shared between cyan and red)

Each is a plain `feGaussianBlur`. The blur acts on whatever fill the ellipse has — no color baked into the filter.

| Filter ID | stdDeviation |
|-----------|-------------|
| `glow-t1` | 6           |
| `glow-t2` | 8           |
| `glow-t3` | 10          |
| `glow-t4` | 12          |
| `glow-t5` | 14          |

### Shadow filters (10: 5 cyan + 5 red)

Each is a `feDropShadow` with the relevant color.

| Filter ID          | color     | stdDeviation | dx | dy | spread |
|--------------------|-----------|-------------|----|----|--------|
| `shadow-cyan-t1`   | `#06B6D4` | 5           | 0  | 0  | 1      |
| `shadow-cyan-t2`   | `#06B6D4` | 6           | 0  | 0  | 1      |
| `shadow-cyan-t3`   | `#06B6D4` | 7           | 0  | 0  | 1      |
| `shadow-cyan-t4`   | `#06B6D4` | 8           | 0  | 0  | 1      |
| `shadow-cyan-t5`   | `#06B6D4` | 9           | 0  | 0  | 1      |
| `shadow-red-t1`    | `#EF4444` | 5           | 0  | 0  | 1      |
| `shadow-red-t2`    | `#EF4444` | 6           | 0  | 0  | 1      |
| `shadow-red-t3`    | `#EF4444` | 7           | 0  | 0  | 1      |
| `shadow-red-t4`    | `#EF4444` | 8           | 0  | 0  | 1      |
| `shadow-red-t5`    | `#EF4444` | 9           | 0  | 0  | 1      |

> **Rationale:** Keeping color out of the glow filter (using element fill instead) means the same 5 glow filters serve both cyan and red dots. The shadow filter must bake in color because `feDropShadow` flood-color is a filter property, not an element property.

---

## D3 Rendering — Athlete City Dots

Replace the current `svg.append('g').selectAll('circle')…` block with:

```typescript
// 1. Data-join on <g> groups
const cityGroups = svg.append('g')
  .selectAll<SVGGElement, City>('g')
  .data(cities.filter(d => projection([d.lng, d.lat]) !== null))
  .join('g')
  .attr('transform', d => {
    const [cx, cy] = projection([d.lng, d.lat])!
    return `translate(${cx},${cy})`
  })
  .style('cursor', 'pointer')
  // event handlers: mouseenter, mousemove, mouseleave (unchanged logic)

// 2. Glow ellipse (large, blurred, transparent)
cityGroups.append('ellipse')
  .attr('rx', d => DOT_TIERS[getTierIndex(d.athletes.length)].glow / 2)
  .attr('ry', d => DOT_TIERS[getTierIndex(d.athletes.length)].glow / 2)
  .attr('fill', '#06B6D4')
  .attr('opacity', 0.3)
  .attr('filter', d => `url(#glow-t${getTierIndex(d.athletes.length) + 1})`)

// 3. Main dot ellipse (solid, with drop shadow)
cityGroups.append('ellipse')
  .attr('rx', d => DOT_TIERS[getTierIndex(d.athletes.length)].dot / 2)
  .attr('ry', d => DOT_TIERS[getTierIndex(d.athletes.length)].dot / 2)
  .attr('fill', '#06B6D4')
  .attr('filter', d => `url(#shadow-cyan-t${getTierIndex(d.athletes.length) + 1})`)

// 4. Core ellipse (white, small)
cityGroups.append('ellipse')
  .attr('rx', d => DOT_TIERS[getTierIndex(d.athletes.length)].core / 2)
  .attr('ry', d => DOT_TIERS[getTierIndex(d.athletes.length)].core / 2)
  .attr('fill', '#FFFFFF')
  .attr('opacity', 0.9)
```

All ellipses are centered at (0, 0) relative to the group's `translate` origin — no `cx`/`cy` needed.

Event handlers attach to the `<g>` group (same `mouseenter`/`mousemove`/`mouseleave` logic as current code, unchanged).

---

## D3 Rendering — State City Dots

Replace the current `g.selectAll('circle')` block (transparent red stroke circles) with the same 3-layer pattern, using the red color scheme and `athleteCount` for tier selection:

```typescript
const tierIdx = (d: StateCityEntry) =>
  getTierIndex(d.athleteCount ?? 0)

// <g> groups per state city
const stateCityGroups = g.selectAll<SVGGElement, StateCityEntry>('g')
  .data(validStateCities)
  .join('g')
  .attr('transform', d => {
    const [cx, cy] = projection([d.lng, d.lat])!
    return `translate(${cx},${cy})`
  })
  .style('pointer-events', 'none')

stateCityGroups.append('ellipse')  // glow
  .attr('rx', d => DOT_TIERS[tierIdx(d)].glow / 2)
  .attr('ry', d => DOT_TIERS[tierIdx(d)].glow / 2)
  .attr('fill', '#EF4444')
  .attr('opacity', 0.3)
  .attr('filter', d => `url(#glow-t${tierIdx(d) + 1})`)

stateCityGroups.append('ellipse')  // dot
  .attr('rx', d => DOT_TIERS[tierIdx(d)].dot / 2)
  .attr('ry', d => DOT_TIERS[tierIdx(d)].dot / 2)
  .attr('fill', '#EF4444')
  .attr('filter', d => `url(#shadow-red-t${tierIdx(d) + 1})`)

stateCityGroups.append('ellipse')  // core
  .attr('rx', d => DOT_TIERS[tierIdx(d)].core / 2)
  .attr('ry', d => DOT_TIERS[tierIdx(d)].core / 2)
  .attr('fill', '#FFFFFF')
  .attr('opacity', 0.9)
```

City labels remain on a separate `g.selectAll('text')` as today — no change to label rendering.

---

## MapWithFilter.tsx Changes

Before the `<UsMap>` render, build an athlete count lookup and enrich `stateCities`:

```typescript
// Build city → athlete count map from currently filtered results
const filteredCityCountMap = new Map(
  filtered.map(c => [c.city, c.athletes.length])
)

const enrichedStateCities = stateCities.map(sc => ({
  ...sc,
  athleteCount: filteredCityCountMap.get(sc.city) ?? 0,
}))
```

Pass `enrichedStateCities` instead of `stateCities` to `<UsMap>`.

---

## Dead Code Removal

Remove from `UsMap.tsx`:
- `const [activeCity, setActiveCity] = useState<string | null>(null)` — was never mutated
- All `activeCity` references in `.attr('class', ...)`, `.attr('r', ...)`, `.attr('fill', ...)` on the old circles
- The `stroke` / `stroke-width` attrs on the old athlete city circles (new layered dots have no stroke)
- Remove `activeCity` from the `useEffect` dependency array

---

## File Change Summary

| File | Change |
|------|--------|
| `components/UsMap.tsx` | Add `DOT_TIERS` + `getTierIndex`; add SVG `<defs>` filters; replace two circle-rendering blocks with 3-layer `<g>` rendering; extend `StateCityEntry` with `athleteCount?`; remove dead `activeCity` state |
| `components/MapWithFilter.tsx` | Compute `filteredCityCountMap`; map `stateCities` → `enrichedStateCities` with `athleteCount`; pass to `UsMap` |

---

## Testing Notes

Manual verification after implementation:
1. Open the map — dots should appear as glowing layered circles.
2. Cities with more athletes should have visibly larger/brighter dots.
3. Click a state — red layered dots appear for top-5 cities, sized by athlete count.
4. Hover any athlete dot — tooltip appears; state border highlights.
5. Run `npm run build` — no errors.
