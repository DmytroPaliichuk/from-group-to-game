# REQ: Sport Discipline Filter

## Summary

Wire up the currently inert Sport dropdown in `MapWithFilter` so users can filter the athlete map by sport discipline. The backend `/athletes/hometowns` endpoint must expose sport titles; the frontend dropdown must populate from live data and apply the selected discipline to the map in real time.

---

## Actors / Users

- **Map viewer** — anyone using the US athlete hometown map's filter controls.

---

## Background (Current State)

The filter bar in `MapWithFilter.tsx` already contains a Sport pill:

```tsx
{/* Sport Disciplines dropdown */}
<div className="flex items-center gap-2">
  <span …>Sport</span>
  <div className="flex items-center gap-1 h-[30px] bg-[#1A1A1A] rounded px-2 cursor-pointer">
    <span …>All Disciplines</span>
    <span …>▾</span>
  </div>
</div>
```

It is hardcoded — clicking does nothing and no state is managed.

The backend `GET /athletes/hometowns` response does not currently include sport information. The raw data has a `sport` array with items shaped `{ title: string, type: string, season: string }`, but this is not forwarded to the frontend.

---

## Functional Requirements

### FR-1 — Backend: expose sport titles

The `/athletes/hometowns` response must include a `sports` field for each athlete entry:

```json
{
  "first_name": "...",
  "last_name": "...",
  "hometown": { ... },
  "olympic_paralympic": "...",
  "seasons": [...],
  "medals": { ... },
  "sports": ["Alpine Skiing", "Biathlon"]
}
```

- `sports` is an array of unique `title` strings derived from the athlete's `sport[]` array.
- Athletes with no `sport` entries receive an empty array `[]`.
- Titles are de-duplicated per athlete (an athlete cannot list the same title twice).

### FR-2 — Frontend: propagate sports through data flow

The `sports` field must be threaded through the data pipeline:

```
app/page.tsx (fetch + transform) → ResizableLayout → MapContentSlider → MapWithFilter
```

The `City` interface (and any intermediate prop types) must be updated to include a `sports: string[]` field on each athlete entry.

### FR-3 — Populate dropdown from data

When the page loads, the Sport dropdown option list must contain:
1. "All Disciplines" as the first item (default / reset).
2. Every unique sport title present across all athletes in the full (unfiltered) dataset, sorted alphabetically.

Duplicates must not appear in the list.

### FR-4 — Dropdown interaction

- Clicking the Sport pill opens the dropdown list.
- Clicking an option selects it and closes the dropdown.
- Clicking "All Disciplines" resets the filter and closes the dropdown.
- Clicking outside the open dropdown closes it without changing the selection.

### FR-5 — Label reflects selection

- Default state: label reads **"All Disciplines"**.
- After selecting a sport: label reads the selected sport name (e.g. **"Alpine Skiing"**).
- The chevron `▾` remains visible at all times.

### FR-6 — Filter applied to map

When a sport is selected:
- An athlete matches if **any** entry in their `sports` array equals the selected discipline (case-sensitive string equality).
- Athletes that do not match are excluded from the rendered city dots.
- Cities with zero remaining athletes after this exclusion are removed from the map (same behaviour as the existing game/season/medal filters).
- The sport filter is applied **in addition to** all other active filters (game, season, medal), not instead of them.

### FR-7 — "All Disciplines" shows all athletes

When "All Disciplines" is selected (the default), the sport filter is inactive and all athletes pass through regardless of their sports field.

---

## Acceptance Criteria

1. **Dropdown opens:** Clicking the Sport pill reveals a scrollable list of sport disciplines plus "All Disciplines" at the top.
2. **Options populated from data:** The dropdown lists every unique sport title in the dataset, sorted alphabetically. No hardcoded list is used.
3. **Selection reflected in label:** After selecting "Alpine Skiing", the pill label reads "Alpine Skiing".
4. **Map filtered:** After selecting a discipline, only city dots where at least one athlete competes in that discipline remain visible.
5. **Combined filters work:** Sport filter is additive with game, season, and medal filters — all active filters apply simultaneously.
6. **Reset works:** Selecting "All Disciplines" returns the map to its pre-filter state.
7. **Close on outside click:** Clicking anywhere outside the open dropdown closes it.
8. **Build passes:** `npm run build` reports no TypeScript or compilation errors.

---

## Design Reference

The pill shape and colours must match the `Component/SportDisciplinesFilter` component in `design.pen`:

| Element          | Value                        |
|------------------|------------------------------|
| Background       | `#1A1A1A`                    |
| Corner radius    | `4px`                        |
| Padding          | `6px` vertical, `8px` horizontal |
| Height           | `30px`                       |
| Label text       | `#f1f5f9`, `14px`, Inter     |
| Chevron          | `#71717A`, `12px`            |
| Label prefix     | `"Sport"` in `#71717A`, `14px`, Geist |

The dropdown list itself should visually match the dark slate theme (`bg-[#1A1A1A]`, rounded corners, `text-[#f1f5f9]`) consistent with the rest of the filter bar.

---

## Edge Cases

- **Athlete with no sports:** `sports: []` — the athlete is excluded when any discipline filter is active (they match no discipline), visible under "All Disciplines".
- **All athletes filtered out:** The map shows no dots; no error state required.
- **Very long sport name:** The pill label expands naturally; no truncation required.
- **Single sport in dataset:** Dropdown shows "All Disciplines" + 1 option.

---

## Out of Scope

- Multi-sport selection (checkboxes, OR/AND across disciplines).
- Search / autocomplete inside the dropdown.
- Persisting filter state in URL query params or localStorage.
- Keyboard navigation within the dropdown (beyond native browser behaviour).
- Any change to the Game, Season, or Medal filter controls.
- Changes to the `Chat` sidebar or `ContentPage` components.
- Changes to the `UsMap` dot rendering or tooltip design.
