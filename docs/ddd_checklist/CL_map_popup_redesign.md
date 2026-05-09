# CL: Map City Popup Redesign

**Design:** `docs/ddd_design/DES_map_popup_redesign.md`  
**Requirement:** `docs/ddd_requirement/REQ_map_popup_redesign.md`

---

## Tasks

### Task 1 — Data pipeline + type groundwork `[ completed ]`

**Files:** `app/page.tsx`, `components/MapWithFilter.tsx`, `components/UsMap.tsx`

**What:**
- `app/page.tsx`: Add `thumbnail: (a.thumbnail_image_list?.[0]?.secure_url) ?? ''` to the athlete push inside `athletes.forEach`.
- `components/MapWithFilter.tsx`: Add `thumbnail: string` to the `City.athletes` inline interface.
- `components/UsMap.tsx`:
  - Add `thumbnail: string` to the `City` interface's `athletes` array type.
  - Extend the `tooltip` state type to include `thumbnail` on each athlete (or carry the full `AthleteData` shape).
  - Remove the existing inline tooltip JSX (`{tooltip && (<div ...>...</div>)}`) from the `return` — the popup will be blank until Task 2 lands.

**Expected diff:** ~50–70 lines (data add, three type changes, JSX removal).  
**Builds cleanly after this task:** yes — the removed JSX leaves `{tooltip && null}` which TypeScript and the build accept. The tooltip just does not render until Task 2.

---

### Task 2 — `CityTooltip.tsx` component + wire into `UsMap` `[ completed ]`

**Depends on:** Task 1

**Files:** `components/CityTooltip.tsx` *(new)*, `components/UsMap.tsx`

**What — `CityTooltip.tsx` (new file):**
- `'use client'` directive.
- Props: `{ x: number; y: number; city: string; athletes: AthleteData[] }` where `AthleteData` matches the type from Task 1.
- Viewport-clamped positioning: default `left: x + 16, top: y - 20`; flip left if `x + 16 + 260 > window.innerWidth`; clamp top if overflowing bottom.
- Fixed width `260 px`, `pointer-events-none`, `fixed z-50`, dark theme (`bg-slate-800 border border-slate-600 rounded-lg shadow-xl`).
- Header: city name, `font-semibold text-slate-100`.
- Athlete list: `overflow-y-auto max-h-[300px]`, one card per athlete.
- Each card:
  - **Avatar** (40×40 px, `rounded-full`): `<img>` with `thumbnail` when non-empty; otherwise a `bg-slate-700` circle with `first_name[0] + last_name[0]` initials.
  - **Name** row: `first_name + ' ' + last_name`, `text-sm text-slate-100`.
  - **Medal row** (always 3 items): 12×12 px colored circle (`#facc15` gold, `#cbd5e1` silver, `#b45309` bronze) + count, `text-xs`.
  - **Sport** line: `sports[0]` if present, `text-xs text-slate-400`; omit if `sports` is empty.

**What — `components/UsMap.tsx`:**
- Import `CityTooltip`.
- Replace the removed JSX slot with `{tooltip && <CityTooltip x={tooltip.x} y={tooltip.y} city={tooltip.city} athletes={tooltip.athletes} />}`.

**Expected diff:** ~110–150 lines (new file ~100–130 lines + ~10–15 lines in UsMap).  
**Builds cleanly after this task:** yes — full feature is live.
