---
title: Athlete Name Search Filter — Checklist
status: in progress
date: 2026-05-09
design: docs/ddd_design/DES_athlete_name_search.md
---

# CL: Athlete Name Search Filter

Two tasks, in dependency order. Task 2 cannot start until Task 1 is author-approved.

---

## Task 1 — Create `components/AthleteSearch.tsx`

**Status:** `completed`  
**Files:** `components/AthleteSearch.tsx` (new file, ~90 lines)

Create the self-contained `AthleteSearch` component. Nothing in the existing codebase changes in this task.

### What to implement

1. **`AthleteEntry` interface** — export it from this file so `MapWithFilter` can import it:
   ```ts
   export interface AthleteEntry {
     id: number
     firstName: string
     lastName: string
     fullName: string
     city: string
     state: string
   }
   ```

2. **`AthleteSearchProps` interface**:
   ```ts
   interface AthleteSearchProps {
     athletes: AthleteEntry[]
     selectedIds: Set<number>
     onSelect: (id: number) => void
     onRemove: (id: number) => void
   }
   ```

3. **Component internals**:
   - `query: string` state (input text)
   - `isOpen: boolean` state (dropdown visibility)
   - `containerRef` + `useEffect` outside-click handler (same pattern as `dropdownRef` in `MapWithFilter`)
   - `matches` computation — filter `athletes` by `!selectedIds.has(a.id)` then substring match on `firstName`/`lastName`, `.slice(0, 8)`; empty array when `query.trim()` is empty

4. **JSX**:
   - Outer `<div ref={containerRef} className="relative flex items-center gap-2">`
   - Label: `<span className="text-sm text-[#71717A]">Athlete</span>`
   - Input wrapper `<div>` styled as `bg-[#1A1A1A] rounded px-2 h-[30px] flex items-center gap-1 flex-wrap min-w-[160px] max-w-[320px]` — holds chips then the `<input>`
   - Chips: `bg-[#334155] text-[#e2e8f0] text-xs rounded px-1.5 py-0.5 flex items-center gap-1`; × button `text-[#94a3b8] hover:text-white` with `aria-label="Remove {fullName}"`
   - `<input>` transparent background, `text-[#f1f5f9] text-sm`, `outline-none`, placeholder `"Search athletes…"` hidden when chips present
   - Dropdown `absolute top-full mt-2 left-0 z-50 rounded-xl bg-[#1e293b] border border-[#334155] min-w-[200px]`; each row `text-[#e2e8f0] text-sm px-3 py-1.5 hover:bg-[#334155] w-full text-left`; empty-state `text-[#94a3b8] text-sm italic px-3 py-2`

5. Dropdown opens on `onChange` when query is non-empty; closes on outside click.  
   Selecting a row calls `onSelect(a.id)` then clears `query` (dropdown closes automatically since `matches` becomes empty).

---

## Task 2 — Wire `AthleteSearch` into `MapWithFilter.tsx`

**Status:** `completed`  
**Files:** `components/MapWithFilter.tsx` (modify, ~55 lines added)  
**Depends on:** Task 1 approved

### What to implement

1. **Import** `AthleteSearch` and `AthleteEntry` from `./AthleteSearch`; add `useMemo` to the React import (it may not be imported yet — check first).

2. **`allAthletes` memo** — flat list of every athlete across all cities, built from the `cities` prop:
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
   ```

3. **`selectedAthleteIds` state**: `const [selectedAthleteIds, setSelectedAthleteIds] = useState(new Set<number>())`

4. **`selectedAthleteKeys` memo** — `Set<string> | null` for O(1) lookup in the filter:
   ```ts
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

5. **Handlers**:
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

6. **Filter predicate** — add `athleteMatch` inside the existing `.filter(a => { ... })` block in the `filtered` computation, and include it in the `return` expression:
   ```ts
   const athleteMatch =
     selectedAthleteKeys === null ||
     selectedAthleteKeys.has(`${a.first_name}|${a.last_name}|${city.city}|${city.state}`)

   return gameMatch && seasonMatch && medalMatch && sportMatch && athleteMatch
   ```
   Note: `city` is the outer variable from the `.map(city => ...)` — it is already in scope.

7. **JSX** — insert `<AthleteSearch>` between the Sport panel `</div>` and the Content Page button:
   ```tsx
   <AthleteSearch
     athletes={allAthletes}
     selectedIds={selectedAthleteIds}
     onSelect={handleAthleteSelect}
     onRemove={handleAthleteRemove}
   />
   ```

8. Run `npm run build` and `npm run lint` and fix any type or lint errors before marking complete.
