# CL: Dot Click Navigates to Content Page

**Design:** `docs/ddd_design/DES_dot_click_to_content_page.md`
**Requirements:** `docs/ddd_requirement/REQ_dot_click_to_content_page.md`

---

## Tasks

### Task 1 — Wire dot click through UsMap and MapWithFilter (detection + notification)
**Status:** `completed`
**Files:** `components/UsMap.tsx`, `components/MapWithFilter.tsx`
**Expected diff:** ~80–120 lines

Changes:
- `UsMap`: add `onCityDotClick?: (city: City) => void` to `UsMapProps` interface and function signature; attach `.on('click', ...)` handler to the D3 city dot selection that calls `onCityDotClick?.(d)`.
- `MapWithFilter`: add `onCityDotClick?: (city: string, state: string) => void` prop; add `notification` state and `notifTimerRef`; add `handleCityDotClick` function that looks up the clicked city in `filtered[]` — calls `onCityDotClick` if athletes exist, otherwise sets the transient notification message with a 2500 ms auto-clear; pass `handleCityDotClick` to `UsMap` as `onCityDotClick`; render the toast `<div>` (absolutely positioned, `pointer-events-none`) when `notification` is non-null.

After this task: dot clicks are detected and the notification fires for empty cities. `onCityDotClick` on `MapWithFilter` is optional, so navigation does not happen yet — the component compiles and runs without Task 2.

---

### Task 2 — MapContentSlider: clickedCity state and city-scoped ContentPage
**Status:** `completed`  
**Depends on:** Task 1  
**Files:** `components/MapContentSlider.tsx`
**Expected diff:** ~40–60 lines

Changes:
- Add `clickedCity: { city: string; state: string } | null` state (initial `null`).
- Add `handleCityDotClick(city: string, state: string)` function: calls `setClickedCity({ city, state })` then `onShowContent(true)`.
- Derive `contentAthletes`: when `clickedCity` is set, filter `filteredAthletes` to matching city+state; otherwise use `filteredAthletes` as-is (preserves existing "Content Page >>" button behaviour).
- Pass `onCityDotClick={handleCityDotClick}` to `MapWithFilter`.
- Update `ContentPage` usage: replace `filteredAthletes` with `contentAthletes` in the `athletes` prop; update `onMapPage` to also call `setClickedCity(null)` before (or after) `onShowContent(false)`.

After this task: full feature is live — dot click navigates and scopes athletes; back to map restores prior state.
