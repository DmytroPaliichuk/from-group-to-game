# DES: City Search Filter

**Requirement:** `docs/ddd_requirement/REQ_city_search.md`

---

## Overview

A new `CitySearch` component mirrors `AthleteSearch` exactly in structure and visual style. It is placed directly to the right of the athlete search bar inside `MapWithFilter`. Selecting cities adds a city-level filter to the existing pipeline — entire city rows are excluded before per-athlete filtering runs.

---

## Data Flow

```mermaid
graph TD
    A[cities prop] --> B[allCities useMemo<br/>deduplicated CityEntry[]]
    B --> C[CitySearch component]
    C --> D[selectedCityIds Set<number>]
    D --> E[selectedCityKeys useMemo<br/>Set<'city|state'> | null]
    E --> F[Filter pipeline]
    A --> F
    F --> G[UsMap]
```

---

## New Type: `CityEntry`

Defined and exported from `components/CitySearch.tsx`:

```typescript
export interface CityEntry {
  id: number      // index in allCities array (stable while cities prop is unchanged)
  city: string    // e.g., "Los Angeles"
  state: string   // abbreviation, e.g., "CA"
  label: string   // dropdown display: "California — Los Angeles"
}
```

The `label` is pre-computed once when `allCities` is built, using a `STATE_NAMES` map (50-entry abbr→full-name constant) defined inside `CitySearch.tsx`.

---

## New Component: `CitySearch`

**File:** `components/CitySearch.tsx`

Structurally identical to `AthleteSearch.tsx`. Props:

```typescript
interface CitySearchProps {
  cities: CityEntry[]
  selectedIds: Set<number>
  onSelect: (id: number) => void
  onRemove: (id: number) => void
}
```

**Matching logic** (case-insensitive substring on `city` name only):

```typescript
const RESULT_CAP = 8

const matches = query.trim().length === 0
  ? []
  : cities
      .filter(c => !selectedIds.has(c.id))
      .filter(c => c.city.toLowerCase().includes(query.toLowerCase()))
      .slice(0, RESULT_CAP)
```

**Chip label:** `c.city` (city name only, e.g., "Los Angeles")  
**Dropdown label:** `c.label` (e.g., "California — Los Angeles")

Visual style (colors, chip shape, input height, font) is identical to `AthleteSearch`.

---

## Changes to `MapWithFilter`

### New state

```typescript
const [selectedCityIds, setSelectedCityIds] = useState(new Set<number>())
```

### New memos

```typescript
// Deduplicated city list — one entry per unique (city, state) pair
const allCities = useMemo<CityEntry[]>(() => {
  const seen = new Set<string>()
  const entries: CityEntry[] = []
  let id = 0
  for (const c of cities) {
    const key = `${c.city}|${c.state}`
    if (!seen.has(key)) {
      seen.add(key)
      entries.push({
        id: id++,
        city: c.city,
        state: c.state,
        label: `${STATE_NAMES[c.state] ?? c.state} — ${c.city}`,
      })
    }
  }
  return entries
}, [cities])

// null = no city restriction; Set = restrict to these composite keys
const selectedCityKeys = useMemo<Set<string> | null>(() => {
  if (selectedCityIds.size === 0) return null
  const keys = new Set<string>()
  for (const id of selectedCityIds) {
    const e = allCities[id]
    keys.add(`${e.city}|${e.state}`)
  }
  return keys
}, [selectedCityIds, allCities])
```

### Updated filter pipeline

City filter is inserted **after** the state dropdown filter and **before** the per-athlete `.map()`:

```typescript
const filtered = (selectedState ? cities.filter(c => c.state === selectedState) : cities)
  .filter(c =>
    selectedCityKeys === null || selectedCityKeys.has(`${c.city}|${c.state}`)
  )
  .map(city => ({
    ...city,
    athletes: city.athletes.filter(a => {
      // existing: gameMatch, seasonMatch, medalMatch, sportMatch, athleteMatch
    })
  }))
  .filter(c => c.athletes.length > 0)
```

### New handler functions

```typescript
function handleCitySelect(id: number) {
  setSelectedCityIds(prev => new Set([...prev, id]))
}

function handleCityRemove(id: number) {
  setSelectedCityIds(prev => {
    const next = new Set(prev)
    next.delete(id)
    return next
  })
}
```

### JSX placement

`<CitySearch>` is added to the right of `<AthleteSearch>` inside the filter bar:

```tsx
{/* Athlete name search */}
<AthleteSearch ... />

{/* City search */}
<CitySearch
  cities={allCities}
  selectedIds={selectedCityIds}
  onSelect={handleCitySelect}
  onRemove={handleCityRemove}
/>
```

---

## State Name Lookup

The `STATE_NAMES` constant (abbr → full name, all 50 states + DC) lives in `CitySearch.tsx` as a module-level constant. It is not shared with `UsMap.tsx` — each file owns its own lookup for its own purpose (`STATE_FIPS` in `UsMap`, `STATE_NAMES` in `CitySearch`).

---

## Filter Interaction Summary

| Active filters | Result |
|---|---|
| City search only | Show athletes from selected cities |
| City search + athlete search | Show selected athletes that also live in selected cities (AND) |
| City search + state dropdown | Show athletes from selected cities that are also in the selected state (AND) |
| City search + any other filter (season, sport, medal) | City-level filter runs first; per-athlete filters run after |

---

## Testing

- Unit: `CitySearch` matching logic (case-insensitive substring, cap, already-selected exclusion, empty query → no results).
- Integration: `MapWithFilter` filter pipeline with city filter active alongside each other filter.
