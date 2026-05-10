# CL: Athlete Card Redesign

**Design:** `docs/ddd_design/DES_athlete_card_redesign.md`  
**Requirements:** `docs/ddd_requirement/REQ_athlete_card_redesign.md`

---

## Tasks

### Task 1 — Data pipeline: backend fields + types + mapping
**Status:** completed  
**Files:** `backend/main.py`, `package.json`, `components/MapWithFilter.tsx`, `app/page.tsx`

Wire the four new fields (`birthday`, `education`, `fun_fact`, `biography`) through every layer from the API response to the `FlatAthlete` type that `AthleteCard` consumes. `AthleteCard` itself is not changed here.

1. **`backend/main.py`** — In `get_hometowns`, add four keys to the result dict:
   ```python
   "birthday":  a.get("bio", {}).get("birthday"),
   "education": a.get("bio", {}).get("education"),
   "fun_fact":  a.get("bio", {}).get("fun_fact"),
   "biography": a.get("bio", {}).get("biography"),
   ```

2. **Install dependency** — `npm install dompurify @types/dompurify` (needed by Task 2).

3. **`components/MapWithFilter.tsx`** — Three sub-changes:
   - Extend `FlatAthlete` export interface with `state: string`, `birthday: string | null`, `education: string | null`, `fun_fact: string | null`, `biography: string | null`.
   - Extend the `City.athletes` inline type with the same four nullable fields (no `state` — it lives on `City` itself).
   - In the `onFilteredChange` `useEffect`, add `state: c.state`, `birthday: a.birthday`, `education: a.education`, `fun_fact: a.fun_fact`, `biography: a.biography` to the mapped object.

4. **`app/page.tsx`** — In the `cityMap.get(key)!.athletes.push(…)` call, add:
   ```typescript
   birthday:  a.birthday  ?? null,
   education: a.education ?? null,
   fun_fact:  a.fun_fact  ?? null,
   biography: a.biography ?? null,
   ```

5. Run `npm run build` — must compile cleanly before Task 2 begins.

---

### Task 2 — AthleteCard redesign + ContentPage grid fix
**Status:** completed  
**Files:** `components/AthleteCard.tsx`, `components/ContentPage.tsx`  
**Depends on:** Task 1 (needs the extended `FlatAthlete` type)

Fully rewrite `AthleteCard` with the new layout, DOMPurify biography sanitization, and the Read-more toggle. Fix the `ContentPage` grid to 2 fixed columns.

1. **`components/AthleteCard.tsx`** — Full rewrite:
   - Import `DOMPurify from 'dompurify'` and `useState` from React.
   - Add a `formatBirthday(iso: string): string` helper using `toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })`.
   - **Top section** (`flex-row`): square photo (e.g. `w-24 h-24`, `object-cover`, rounded) on the left; `onError` or absent thumbnail shows initials centered on `bg-[#0f172a]`. To the right, stacked vertically:
     - Full name — `text-slate-100 font-semibold`
     - Hometown — `{city}, {state}` — `text-slate-300 text-sm`
     - Birthday — `formatBirthday(birthday)` — `text-slate-400 text-xs` — hidden if null
     - Education — `text-slate-400 text-xs` — hidden if null/empty
     - Sports — joined with `, ` — `text-slate-400 text-xs` — hidden if empty array
   - **Bottom section** (stacked below top):
     - Medals — emoji + count, only non-zero, hidden entirely if all zero (existing logic, reused).
     - Fun fact — `text-slate-300 text-sm italic` — hidden if null/empty.
     - Biography — `DOMPurify.sanitize(biography)` rendered via `dangerouslySetInnerHTML`. Collapsed state: `max-h-[4.5rem] overflow-hidden`. Expanded state: no max-height. Hidden entirely if null/empty.
     - "Read more ▼" / "Show less ▲" toggle button — `text-sky-400 text-xs mt-1` — only rendered when biography is non-null.
   - Per-card expand state: `const [bioExpanded, setBioExpanded] = useState(false)`.

2. **`components/ContentPage.tsx`** — Change the grid class from `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` to `grid-cols-2`.

3. Run `npm run build` — must compile cleanly with no TypeScript errors.
