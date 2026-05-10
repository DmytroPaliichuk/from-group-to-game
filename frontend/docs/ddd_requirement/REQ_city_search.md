# REQ: City Search Filter

## Summary

Add a city search component placed directly next to the existing athlete search bar. Users type a city name to get a dropdown of matching cities (formatted as "State — City"), select one or more cities as chips, and the map filters to show only athletes from those cities. The UX mirrors the athlete search exactly: chip-based multi-select, same visual style, same result cap.

---

## Actors

- **End user** — anyone viewing the interactive US athlete map who wants to explore athletes by hometown city.

---

## Primary Flow

1. User sees the city search input to the right of the athlete search bar.
2. User types a city name (e.g., "Los").
3. A dropdown appears showing up to 8 matching cities, each formatted as **"State — City"** (e.g., "California — Los Angeles"), ordered by the natural data order.
4. User clicks (or keyboard-selects) a city. The dropdown closes, the input clears, and a **city-name-only chip** (e.g., "Los Angeles") appears inside the input box.
5. The map immediately filters to show only athletes whose hometown is one of the selected cities.
6. User may continue typing to add more cities (multi-select).
7. User removes a city by clicking the **×** on its chip. The map filter updates immediately.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | The city search input is rendered immediately adjacent (to the right) to the athlete search bar. |
| AC-2 | Typing into the input performs a case-insensitive substring match against **city names only** (not state names). |
| AC-3 | The dropdown shows at most **8** matching cities that have not already been selected. |
| AC-4 | Each dropdown entry is formatted as **"State — City"** (full state name, em-dash, city name). |
| AC-5 | Selecting a city adds it as a chip showing the **city name only**. The input clears and the dropdown closes. |
| AC-6 | Clicking **×** on a chip removes that city from the active filter. |
| AC-7 | When no cities are selected, the city filter has no effect (all cities pass). |
| AC-8 | When one or more cities are selected, only athletes whose city exactly matches one of the selected cities are shown on the map. |
| AC-9 | If both city search and athlete search filters are active, **both** must match for an athlete to appear (AND logic). |
| AC-10 | If both the state dropdown filter and the city search filter are active, **both** must match (AND logic). An athlete must belong to the selected state AND be in a selected city. |
| AC-11 | When the input is empty or contains only whitespace, the dropdown does not appear. |
| AC-12 | Clicking outside the component closes the dropdown without clearing the input value. |
| AC-13 | The dropdown shows "No results" when the query matches zero unselected cities. |
| AC-14 | The visual style (colors, chip style, input height, font) matches the athlete search component exactly. |

---

## Data Source

- Cities are derived from the **existing `cities` prop** passed to `MapWithFilter` — the same dataset used by the map. Only cities that have at least one athlete appear in the city search dropdown. No additional data fetch is required.

---

## Errors & Edge Cases

| Case | Behavior |
|------|----------|
| Same city name in two states (e.g., "Springfield, IL" and "Springfield, MO") | Both appear as separate dropdown entries; selecting one does not select the other. City identity is composite: city name + state. |
| All athletes in a selected city are filtered out by other active filters (season, sport, medal) | The city dot disappears from the map; the chip remains. No error shown. |
| Selecting a city that is also excluded by the state dropdown | Zero athletes shown; chip remains. User is responsible for resolving the conflict. |
| City search active + athlete search active with conflicting cities | Zero athletes shown (AND logic). Both sets of chips remain visible. |

---

## Non-Functionals

- **Performance:** The city list is small (bounded by the number of distinct cities in the dataset). Filtering is synchronous and in-memory; no debounce or async call is needed.
- **Accessibility:** The input and dropdown must be keyboard-navigable (arrow keys to move through results, Enter to select, Escape to close). Chips must be removable via keyboard.

---

## Out of Scope

- Searching by **state name** (typing "California" does not surface cities).
- **Visual highlighting** of selected city dots on the map (no special color or ring).
- The city search **disabling or overriding** the state dropdown — both filters remain independent and combine with AND logic.
- Sorting or grouping dropdown results by state.
- Pagination of results beyond the 8-item cap.
- Any server-side search or autocomplete API call.
