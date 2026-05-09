---
title: Athlete Name Search Filter — Design
status: final
date: 2026-05-09
req: docs/ddd_requirement/REQ_athlete_name_search.md
---

# DES: Athlete Name Search Filter

## Overview

A new `AthleteSearch` component is added to `components/AthleteSearch.tsx` and rendered inside the `MapWithFilter` filter bar, to the right of the Sport dropdown. `MapWithFilter` owns the selection state and integrates it into its existing filter expression. No new API calls; all data comes from the `cities` prop already in memory.

---

## Architecture

```
MapWithFilter.tsx
  ├── allAthletes: AthleteEntry[]   (useMemo from cities prop)
  ├── selectedAthleteIds: Set<number>
  ├── selectedAthleteKeys: Set<string> | null   (useMemo, for O(1) filter lookup)
  │
  ├── filter bar JSX
  │     └── <AthleteSearch
  │             athletes={allAthletes}
  │             selectedIds={selectedAthleteIds}
  │             onSelect={handleAthleteSelect}
  │             onRemove={handleAthleteRemove}
  │         />
  │
  └── filtered cities  ──→  <UsMap />
```

---

## Data Model

### `AthleteEntry`

Built once in `MapWithFilter` via `useMemo`:

```ts
interface AthleteEntry {
  id: number        // flat index into the allAthletes array; stable while cities prop is unchanged
  firstName: string
  lastName: string
  fullName: string  // `${firstName} ${lastName}` — pre-computed for display
  city: string      // hometown city  — used to build the composite lookup key
  state: string     // hometown state — used to build the composite lookup key
}
```

**Why flat index?** Each athlete needs a unique identity for React state. A running index assigned during the `useMemo` traversal is the simplest unique handle. It is stable as long as `cities` doesn't change — which it doesn't at runtime (data is fetched once on the server and passed down as props).

### `selectedAthleteKeys` (derived, for filter performance)

```ts
// null  → no athlete restriction; map respects only the other filters
// Set   → only athletes whose composite key is in this set pass the athlete filter
type SelectedAthleteKeys = Set<string> | null
// key format: `${firstName}|${lastName}|${city}|${state}`
```

Deriving a composite-key `Set` from the selected IDs on each render (via `useMemo`) lets the filter loop do a `Set.has()` check instead of scanning the `allAthletes` array repeatedly. This keeps filtering O(n) in the number of athletes.

---

## Component: `AthleteSearch`

**File:** `components/AthleteSearch.tsx`

### Props

```ts
interface AthleteSearchProps {
  athletes: AthleteEntry[]       // full unfiltered flat list
  selectedIds: Set<number>       // currently selected athlete IDs
  onSelect: (id: number) => void // called when user picks a dropdown entry
  onRemove: (id: number) => void // called when user clicks × on a chip
}
```

### Internal state

| State | Type | Purpose |
|---|---|---|
| `query` | `string` | Current text in the input |
| `isOpen` | `boolean` | Whether the dropdown is visible |

A `containerRef` on the wrapper `<div>` drives the outside-click handler (same pattern as the existing Sport dropdown).

### Matching logic

```ts
const RESULT_CAP = 8

const matches: AthleteEntry[] = query.trim().length === 0
  ? []
  : athletes
      .filter(a => !selectedIds.has(a.id))
      .filter(a => {
        const q = query.toLowerCase()
        return (
          a.firstName.toLowerCase().includes(q) ||
          a.lastName.toLowerCase().includes(q)
        )
      })
      .slice(0, RESULT_CAP)
```

Searches the **full** unfiltered athlete list (not the map-visible filtered list), so a user can search for any athlete regardless of other active filters. The cap of 8 keeps the dropdown compact; users type more characters to narrow further.

### JSX structure

```
<div ref={containerRef} class="relative">          ← outside-click boundary

  <div class="input-wrapper flex items-center">   ← mimics an input; holds chips + real input
    {selectedIds.map(id => (
      <span key={id} class="chip">
        {athletes[id].fullName}
        <button aria-label="Remove {fullName}" onClick={onRemove(id)}>×</button>
      </span>
    ))}
    <input
      aria-label="Search athletes by name"
      placeholder={selectedIds.size === 0 ? "Search athletes…" : ""}
      value={query}
      onChange={setQuery; openDropdown}
    />
  </div>

  {isOpen && (
    <div class="dropdown absolute top-full z-50">
      {matches.length === 0
        ? <span class="empty-state">No results</span>
        : matches.map(a => (
            <button key={a.id} onClick={() => { onSelect(a.id); setQuery('') }}>
              {a.fullName}
            </button>
          ))
      }
    </div>
  )}

</div>
```

The `placeholder` is hidden once chips are present so the two don't overlap.

---

## Changes to `MapWithFilter`

### New state

```ts
const [selectedAthleteIds, setSelectedAthleteIds] = useState(new Set<number>())
```

### New memos

```ts
const allAthletes = useMemo<AthleteEntry[]>(() => {
  const entries: AthleteEntry[] = []
  let id = 0
  for (const city of cities) {
    for (const a of city.athletes) {
      entries.push({
        id: id++,
        firstName: a.first_name,
        lastName: a.last_name,
        fullName: `${a.first_name} ${a.last_name}`,
        city: city.city,
        state: city.state,
      })
    }
  }
  return entries
}, [cities])

const selectedAthleteKeys = useMemo<Set<string> | null>(() => {
  if (selectedAthleteIds.size === 0) return null
  const keys = new Set<string>()
  for (const id of selectedAthleteIds) {
    const e = allAthletes[id]
    keys.add(`${e.firstName}|${e.lastName}|${e.city}|${e.state}`)
  }
  return keys
}, [selectedAthleteIds, allAthletes])
```

### New handlers

```ts
function handleAthleteSelect(id: number) {
  setSelectedAthleteIds(prev => new Set([...prev, id]))
}

function handleAthleteRemove(id: number) {
  setSelectedAthleteIds(prev => {
    const next = new Set(prev)
    next.delete(id)
    return next
  })
}
```

### Updated filter expression

One new predicate added to the existing `.filter()` inside the `.map()`:

```ts
const athleteMatch =
  selectedAthleteKeys === null ||
  selectedAthleteKeys.has(
    `${a.first_name}|${a.last_name}|${city.city}|${city.state}`
  )

return gameMatch && seasonMatch && medalMatch && sportMatch && athleteMatch
```

When `selectedAthleteKeys` is `null` (no athletes selected) the expression short-circuits to `true`, so the filter is a no-op — existing behavior is preserved exactly.

### JSX placement

```tsx
{/* Sport Disciplines panel */}
<div ref={dropdownRef} ...> ... </div>

{/* Athlete search — NEW */}
<AthleteSearch
  athletes={allAthletes}
  selectedIds={selectedAthleteIds}
  onSelect={handleAthleteSelect}
  onRemove={handleAthleteRemove}
/>

{/* Content page button */}
{onContentPage && <button ...>Content Page &gt;&gt;</button>}
```

---

## Visual Layout (filter bar)

```
[ Game ]  [ Season ]  [ Medals ]  [ Sport ▾ ]  [ × Alice Lee | type... ]  [ Content Page >> ]
```

The search wrapper uses `flex-1 min-w-[160px] max-w-[320px]` to be flexible in the bar without
pushing the Content Page button off screen.

---

## Styling

Follows the existing dark-slate theme in `MapWithFilter`:

| Element | Style notes |
|---|---|
| Input wrapper | `bg-[#1A1A1A] rounded px-2 h-[30px]` — same height as the Sport button |
| Chips | `bg-[#334155] text-[#e2e8f0] text-xs rounded px-1.5 py-0.5` |
| Chip × button | `text-[#94a3b8] hover:text-white ml-1` |
| Dropdown | `bg-[#1e293b] border border-[#334155] rounded-xl` — matches Sport panel |
| Dropdown rows | `text-[#e2e8f0] text-sm px-3 py-1.5 hover:bg-[#334155]` |
| Empty state | `text-[#94a3b8] text-sm italic px-3 py-2` |

---

## Testing

- Verify that with 0 athletes selected the map renders identically to pre-change behavior.
- Select one athlete; confirm only their city dot appears (if they pass other filters).
- Select two athletes in different cities; confirm both city dots appear.
- Toggle a Season filter that excludes a selected athlete; confirm their chip stays but their dot disappears.
- Type a name that matches nothing; confirm "No results" empty state.
- Type a single common letter (e.g. "a"); confirm at most 8 results shown.
