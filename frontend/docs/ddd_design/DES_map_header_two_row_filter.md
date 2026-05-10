# DES: Map Header Two-Row Filter Redesign

**Requirement:** `docs/ddd_requirement/REQ_map_header_two_row_filter.md`

## Summary

Replace the single-row filter bar in `MapWithFilter` with two stacked rows separated by a thin divider. Row 1 holds the primary filter controls (Game, Season, Medal, Sport) and a right-aligned Content Page button. Row 2 holds Athlete Search and City Search side by side at equal width. All filter logic and state remain untouched — this is a layout-only change, plus a minor prop addition to the two search components so they can stretch to fill their half.

---

## Files Changed

| File | Change |
|---|---|
| `components/MapWithFilter.tsx` | Restructure header JSX into two rows |
| `components/AthleteSearch.tsx` | Add optional `className` prop; remove `max-w-[320px]` from input container |
| `components/CitySearch.tsx` | Same as AthleteSearch |

---

## Layout Structure

```
MapWithFilter root div (flex flex-col)
├── Row 1  (flex items-center gap-8, border-b border-[#334155], py-2)
│   ├── Game toggle
│   ├── Season toggle
│   ├── Medal toggles
│   ├── Sport dropdown (relative-positioned, stays in row 1)
│   └── Content Page button  (ml-auto)
├── Row 2  (flex gap-4, py-2)
│   ├── AthleteSearch  (className="flex-1 min-w-0")
│   └── CitySearch     (className="flex-1 min-w-0")
└── UsMap  (flex-1, fills remaining height)
```

The existing outer `p-4 gap-3` on the root stays in place; rows are distinguished by the divider, not by separate padding overrides.

---

## Component Changes

### AthleteSearch / CitySearch

Add one optional prop:

```ts
interface AthleteSearchProps {
  // ... existing props ...
  className?: string
}
```

Apply it to the root div:

```tsx
<div ref={containerRef} className={`relative flex items-center gap-2 ${className ?? ''}`}>
```

Remove `max-w-[320px]` from the inner input container and replace with `flex-1` so it grows within whatever width the parent grants:

```tsx
// before
<div className="flex items-center gap-1 flex-wrap bg-[#1A1A1A] rounded px-2 h-[30px] min-w-[160px] max-w-[320px] overflow-hidden">

// after
<div className="flex items-center gap-1 flex-wrap bg-[#1A1A1A] rounded px-2 h-[30px] min-w-[160px] flex-1 overflow-hidden">
```

The `min-w-[160px]` floor is kept so the inputs never collapse to zero on very narrow containers.

### MapWithFilter — Row 1

Replace the existing single `div.flex.items-center.h-[52px].gap-8.flex-shrink-0` with:

```tsx
<div className="flex items-center gap-8 flex-shrink-0 border-b border-[#334155] pb-2">
  {/* Game toggle */}
  {/* Season toggle */}
  {/* Medal toggles */}
  {/* Sport dropdown */}
  {/* Content Page button — ml-auto keeps it right-aligned */}
  {onContentPage && (
    <button onClick={onContentPage} className="ml-auto h-12 ...">
      Content Page &gt;&gt;
    </button>
  )}
</div>
```

The `h-[52px]` fixed height is removed so the row sizes naturally to its tallest child (the 48px circular buttons plus `py-2`).

### MapWithFilter — Row 2

```tsx
<div className="flex gap-4 flex-shrink-0 pt-2">
  <AthleteSearch
    className="flex-1 min-w-0"
    athletes={allAthletes}
    selectedIds={selectedAthleteIds}
    onSelect={handleAthleteSelect}
    onRemove={handleAthleteRemove}
  />
  <CitySearch
    className="flex-1 min-w-0"
    cities={allCities}
    selectedIds={selectedCityIds}
    onSelect={handleCitySelect}
    onRemove={handleCityRemove}
  />
</div>
```

`min-w-0` on each flex child prevents flex overflow when selected tags accumulate.

---

## Divider

`border-b border-[#334155]` on Row 1 produces a 1px line matching the existing sport-panel divider color. No separate `<hr>` element needed.

---

## Height Impact

Removing the fixed `h-[52px]` from the old single row and adding two natural-height rows means the header will grow to approximately 104–110px total (two rows of ~48px controls + divider + `py-2` top/bottom). The `UsMap` below sits in a `flex-1` div, so it shrinks automatically to fill the remaining space without any explicit height calculation needed.

---

## Testing

1. Build passes (`npm run build`) with no TypeScript errors.
2. Visually: Row 1 shows Game/Season/Medal/Sport left-aligned, Content Page right-aligned, thin divider below.
3. Visually: Row 2 shows Athlete Search and City Search at equal width filling the full header width.
4. All filter interactions (toggle, sport dropdown, searches, content page navigation) behave identically to before.
