# CL: City Search Filter

**Design:** `docs/ddd_design/DES_city_search.md`  
**Requirement:** `docs/ddd_requirement/REQ_city_search.md`

---

## Tasks

### Task 1 — Create `CitySearch` component
**Status:** `completed`  
**Files:** `components/CitySearch.tsx` (new file)

Create the full `CitySearch` component. Mirrors `AthleteSearch.tsx` exactly in structure and visual style.

Deliverables:
- `STATE_NAMES` module-level constant: 50-state + DC abbreviation → full name map (e.g., `CA: 'California'`)
- `CityEntry` interface (exported): `{ id, city, state, label }`
- `CitySearch` component (default export) with props `{ cities: CityEntry[], selectedIds: Set<number>, onSelect, onRemove }`
- Matching: case-insensitive substring on `city` field only, capped at 8, excludes already-selected IDs
- Chips show `c.city` (city name only); dropdown entries show `c.label` ("California — Los Angeles")
- Outside-click handler closes dropdown (same `useRef` + `mousedown` pattern as `AthleteSearch`)
- "Search cities…" placeholder, hidden once a chip is present
- Visual style identical to `AthleteSearch`: same colors, chip shape, input height, font

---

### Task 2 — Wire `CitySearch` into `MapWithFilter`
**Status:** `completed`  
**Files:** `components/MapWithFilter.tsx` (modified)

Integrate the new component and city filter into the existing parent. Depends on Task 1.

Deliverables:
- Import `CitySearch` and `CityEntry` from `./CitySearch`
- Add `selectedCityIds` state: `useState(new Set<number>())`
- Add `allCities` useMemo: deduplicate cities from the `cities` prop into `CityEntry[]`, pre-computing `label` via `STATE_NAMES` (imported from `CitySearch` or re-used via the component's own constant — since `STATE_NAMES` is module-private, import `CityEntry` type only and inline the label computation using the same map, or export `STATE_NAMES` from `CitySearch.tsx`)
- Add `selectedCityKeys` useMemo: `Set<string> | null` of `"city|state"` composite keys derived from `selectedCityIds`
- Add `handleCitySelect` and `handleCityRemove` handler functions
- Update filter pipeline: insert `.filter(c => selectedCityKeys === null || selectedCityKeys.has(`${c.city}|${c.state}`))` after the state dropdown filter and before the per-athlete `.map()`
- Add `<CitySearch>` JSX immediately to the right of `<AthleteSearch>` in the filter bar

> **Note on `STATE_NAMES`:** Export the constant from `CitySearch.tsx` so `MapWithFilter` can import and reuse it when building `allCities`. This avoids duplicating the 50-entry map.
