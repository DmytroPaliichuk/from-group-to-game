# CL: Medal Filter — All-Selected Default with Exclusion Logic

**Design:** `docs/ddd_design/DES_medal_filter_default_selected.md`  
**Requirement:** `docs/ddd_requirement/REQ_medal_filter_default_selected.md`

## Tasks

### Task 1 — Flip medal filter to exclusion mode `completed`

**File:** `components/MapWithFilter.tsx`

Three co-located edits in one commit:

1. **Initial state** — seed the Set with all four keys so all buttons start selected:
   ```ts
   // line 70 — change from:
   const [medalFilter, setMedalFilter] = useState(new Set<string>())
   // to:
   const [medalFilter, setMedalFilter] = useState(
     new Set(['gold', 'silver', 'bronze', 'noMedal'])
   )
   ```

2. **Filter predicate** — replace inclusion logic (line 142) with exclusion logic:
   ```ts
   // Before
   const medalMatch =
     medalFilter.size === 0 ||
     [...medalFilter].every(m => a.medals[m as keyof typeof a.medals] > 0)

   // After
   const isNoMedal =
     a.medals.gold === 0 && a.medals.silver === 0 && a.medals.bronze === 0
   const medalMatch =
     (medalFilter.has('gold')    || a.medals.gold === 0) &&
     (medalFilter.has('silver')  || a.medals.silver === 0) &&
     (medalFilter.has('bronze')  || a.medals.bronze === 0) &&
     (medalFilter.has('noMedal') || !isNoMedal)
   ```

3. **Ø button** — add `onClick` and reactive border/opacity styling (lines 224–226):
   ```tsx
   // Before (static, no handler)
   <button className="w-12 h-12 rounded-full border-2 border-[#475569] opacity-55 bg-[#1e293b] flex items-center justify-center">

   // After
   <button
     onClick={() => toggleMedal('noMedal')}
     className={`w-12 h-12 rounded-full border-2 bg-[#1e293b] flex items-center justify-center transition-all
       ${medalFilter.has('noMedal') ? 'border-[#06B6D4] opacity-100' : 'border-[#475569] opacity-55'}`}
   >
   ```

**Verification:**
- Page loads → all four buttons are cyan/full-opacity; all athletes appear.
- Deselect gold → athletes with `gold > 0` disappear; re-select → they return.
- Deselect Ø → medal-less athletes disappear.
- Deselect all four → map shows zero dots.
- Game / Season / Sport filters still work in combination.
- `npm run build` passes with no type errors.
