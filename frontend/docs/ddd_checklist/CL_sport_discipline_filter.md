# CL: Sport Discipline Filter

Design reference: `docs/ddd_design/DES_sport_discipline_filter.md`
Requirements reference: `docs/ddd_requirement/REQ_sport_discipline_filter.md`

---

## Task 1 — Backend sports field + frontend data pipeline

**Status:** `completed`

**Files:**
- `backend/main.py`
- `app/page.tsx`
- `components/MapContentSlider.tsx`

**What to do:**

1. In `backend/main.py`, add a `sports` field to each athlete dict inside `get_hometowns`:
   ```python
   "sports": list({s.get("title") for s in a.get("sport", []) if s.get("title")}),
   ```

2. In `app/page.tsx`:
   - Extend the inline `cityMap` type to include `sports: string[]` on each athlete entry.
   - Add `sports: a.sports ?? []` to the `athletes.push()` call.

3. In `components/MapContentSlider.tsx`:
   - Add `sports: string[]` to the athlete shape inside the `City` interface.

**Acceptance gate:** `npm run build` passes with no TypeScript errors. No visible UI change.

**Estimated diff:** ~15 lines across 3 files.

---

## Task 2 — MapWithFilter sport dropdown and filter logic

**Status:** `completed`

**Files:**
- `components/MapWithFilter.tsx`

**What to do:**

1. Update the `City` interface's athlete shape to add `sports: string[]`.

2. Update the `useState`/`useMemo`/`useRef` imports at the top of the file.

3. Add new state and ref:
   ```ts
   const [sportFilter, setSportFilter] = useState('')
   const [sportOpen, setSportOpen]     = useState(false)
   const dropdownRef = useRef<HTMLDivElement>(null)
   ```

4. Add the `allSports` derived list:
   ```ts
   const allSports = useMemo(() =>
     [...new Set(cities.flatMap(c => c.athletes.flatMap(a => a.sports)))].sort()
   , [cities])
   ```

5. Add the outside-click `useEffect`:
   ```ts
   useEffect(() => {
     if (!sportOpen) return
     const handler = (e: MouseEvent) => {
       if (!dropdownRef.current?.contains(e.target as Node)) setSportOpen(false)
     }
     document.addEventListener('mousedown', handler)
     return () => document.removeEventListener('mousedown', handler)
   }, [sportOpen])
   ```

6. Append sport match to the athlete filter predicate:
   ```ts
   const sportMatch = sportFilter === '' || a.sports.includes(sportFilter)
   return gameMatch && seasonMatch && medalMatch && sportMatch
   ```

7. Replace the static Sport pill block with the interactive dropdown:
   ```tsx
   <div ref={dropdownRef} className="relative flex items-center gap-2">
     <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>Sport</span>
     <div
       onClick={() => setSportOpen(o => !o)}
       className="flex items-center gap-1 h-[30px] bg-[#1A1A1A] rounded px-2 cursor-pointer"
     >
       <span className="text-[#f1f5f9] text-sm">{sportFilter || 'All Disciplines'}</span>
       <span className="text-[#71717A] text-xs">▾</span>
     </div>
     {sportOpen && (
       <div className="absolute top-full mt-1 left-0 bg-[#1A1A1A] border border-[#334155] rounded z-50 max-h-60 overflow-y-auto min-w-[160px]">
         <button
           onClick={() => { setSportFilter(''); setSportOpen(false) }}
           className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-[#334155] ${sportFilter === '' ? 'text-[#06B6D4]' : 'text-[#f1f5f9]'}`}
         >
           All Disciplines
         </button>
         {allSports.map(sport => (
           <button
             key={sport}
             onClick={() => { setSportFilter(sport); setSportOpen(false) }}
             className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-[#334155] ${sportFilter === sport ? 'text-[#06B6D4]' : 'text-[#f1f5f9]'}`}
           >
             {sport}
           </button>
         ))}
       </div>
     )}
   </div>
   ```

**Acceptance gate:** `npm run build` passes. Clicking the Sport pill opens a sorted list of disciplines; selecting one filters map dots; selecting "All Disciplines" resets; clicking outside closes the dropdown.

**Estimated diff:** ~45 lines in 1 file.
