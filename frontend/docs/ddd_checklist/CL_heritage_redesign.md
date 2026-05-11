# CL: Heritage UI Redesign

**Design:** `docs/ddd_design/DES_heritage_redesign.md`  
**Date:** 2026-05-11  

Each task is a compilable, commit-sized unit. Tasks must be completed in order — later tasks depend on earlier ones.

---

## Task 1 — Foundation: install lucide-react, fonts, tokens, TopBar component
**Status:** `completed`  
**Files:** `package.json`, `app/layout.tsx`, `app/globals.css`, `components/TopBar.tsx` (NEW)  
**~150 lines**

1. Run `npm install lucide-react`
2. `app/layout.tsx`: replace current Google Fonts `<link>` with one that also includes Archivo Black:
   ```
   Archivo+Black&family=Inter:wght@400;500;600;700;800;900
   ```
   Keep existing preconnect tags.
3. `app/globals.css`: replace `body { background: #020617; ... }` and `.state { ... }` with:
   - Heritage CSS variables on `:root` (bg-canvas, bg-surface, fg-1/2/3, accent-green, dark-green, mint, border-subtle, shadow-ring, font-display, font-body)
   - `body`: `background: #fafaf7; color: #0e0f0c; font-family: 'Inter', sans-serif;`
   - Keep `.state` class but update to Heritage map colors: `fill: #eef2ec; stroke: rgba(14,15,12,0.15); stroke-width: 0.5`
4. `components/TopBar.tsx` (NEW): full-width Heritage top bar.
   - Props interface `TopBarProps` as specified in DES §TopBar
   - Logo: 28px black circle + 10px green dot (absolute top-right) + "OlymPick" in `font-family: 'Archivo Black'`
   - Vertical 1px separator
   - Filter groups (each: uppercase kicker + buttons): Game (Zap/Accessibility icons), Season (Sun/Snowflake), Medals (4 colored pips), Sport (pill button showing `sportFilter.size === 0 ? 'All disciplines ▼' : sportFilter.size + ' sports ▼'`)
   - Active/inactive circle button styles per DES
   - Right side: "Clear filters" ghost button + "Content page →" / "← Map page" green pill toggle
   - Height: 72px, `background: #fff`, bottom border `1px solid rgba(14,15,12,0.10)`
   - `'use client'` directive

**Build check:** `npm run build` must pass. TopBar is not yet rendered anywhere — it's just compiled.

---

## Task 2 — Share sport lists + SportModal component
**Status:** `completed`  
**Files:** `lib/sports.ts` (NEW), `components/SportModal.tsx` (NEW), `components/MapWithFilter.tsx`  
**~160 lines**

1. `lib/sports.ts` (NEW): export `SUMMER_SPORTS: string[]` and `WINTER_SPORTS: string[]` — copy verbatim from the current `MapWithFilter.tsx` constants.
2. `components/SportModal.tsx` (NEW): full-screen overlay modal per DES §SportModal.
   - Fixed overlay: `position: fixed, inset: 0, background: rgba(14,15,12,0.40), zIndex: 50, display: flex, alignItems: center, justifyContent: center`
   - White card: `width: 880px, maxHeight: 85vh, borderRadius: 30px, background: #fff`; flex column with header / scroll area / footer
   - Header: "Pick your sports." (Archivo Black 28px) + "{pendingSports.size} selected · {total} total disciplines" subtitle + close × button (40px circle)
   - Scroll area: two labeled search inputs (visual only, no functional wiring) + SUMMER section (☀ amber) + WINTER section (❄ blue); each section has a divider line + 3-column checkbox grid
   - Checkbox: green bg + Check icon when checked; white bg + gray border when unchecked; toggle via `onToggle(sport)`
   - Footer: "Clear all" ghost | "Cancel" outline pill | "Apply {N} filters" green pill
   - Backdrop click calls `onCancel`; props interface per DES
   - `'use client'` directive
3. `components/MapWithFilter.tsx`: replace the inline `const SUMMER_SPORTS = [...]` and `const WINTER_SPORTS = [...]` definitions with `import { SUMMER_SPORTS, WINTER_SPORTS } from '@/lib/sports'` (keep all other code unchanged).

**Build check:** `npm run build` must pass. SportModal not yet rendered anywhere.

---

## Task 3 — Restyle Chat.tsx
**Status:** `completed`  
**Files:** `components/Chat.tsx`  
**~80 lines**

Visual-only changes — all logic, state, and API calls stay identical:

1. Container `<aside>`: `background: #fff, borderRadius: 30px, border: 1px solid rgba(14,15,12,0.10), height: 100%, display: flex, flexDirection: column, overflow: hidden` (remove dark Tailwind classes)
2. Header: replace "AI Chat" + blue "New Session" button with:
   - Left: green 28px circle with Lucide `Sparkles` icon (dark green, size 14) + title "Ask OlymPick" (14px, 700) + subtitle "Online · 128 yrs of data" (11px, `#868685`)
   - Right: "+ New" mint pill button (`background: #e2f6d5, color: #163300, padding: 7px 12px, borderRadius: 9999, fontSize: 11px, fontWeight: 700`) — wires to existing `newSession()`
3. User bubble: `background: #0e0f0c, color: #fafaf7, borderRadius: 20px 20px 4px 20px, padding: 10px 16px`
4. AI bubble: `background: #fff, color: #0e0f0c, borderRadius: 4px 20px 20px 20px, padding: 12px 16px, boxShadow: rgba(14,15,12,0.10) 0 0 0 1px`
5. System message: italic, centered, `color: #868685`
6. Follow-up chips: `background: #e2f6d5, color: #163300, borderRadius: 9999, padding: 7px 12px, fontSize: 12px, fontWeight: 600`; remove left-border style
7. Composer row: replace current input+send with pill-shaped container (`borderRadius: 9999, boxShadow: rgba(14,15,12,0.12) 0 0 0 1px, padding: 6px 6px 6px 18px`) containing:
   - Text input (transparent bg, no border, Inter 14px) — wires to existing `input`/`handleKeyDown`
   - Lucide `Mic` icon button (transparent bg, `#454745`)
   - Lucide `ArrowRight` send button (`width: 36, height: 36, borderRadius: 50%, background: #9fe870, color: #163300`) — wires to existing `send()`
8. Empty state text: `color: #868685`

**Build check:** `npm run build` must pass.

---

## Task 4 — Restyle CityTooltip.tsx
**Status:** `completed`  
**Files:** `components/CityTooltip.tsx`  
**~80 lines**

Visual-only — positioning logic and athlete data props unchanged:

1. Container: `background: #fff, borderRadius: 20px, boxShadow: rgba(14,15,12,0.20) 0 0 0 1px + rgba(14,15,12,0.10) 0 12px 32px, width: 280px`; remove Tailwind dark classes
2. Header area (replace current city-name div):
   - Row: city name in `font-family: 'Archivo Black', fontSize: 22px, color: #0e0f0c` + "HOMETOWN" badge (`background: #e2f6d5, color: #163300, borderRadius: 9999, fontSize: 10px, fontWeight: 700, padding: 3px 8px`)
   - Subtitle: `"{state} · {athletes.length} athletes"`, `color: #868685`, 11px, weight 600
3. Athlete rows (replace current athlete list):
   - 10px padding top/bottom, 1px subtle border between rows (not on first)
   - Avatar (40px):
     - If thumbnail: `<img>` rounded circle, `onError` fallback
     - Else: gradient circle using `hsl` from name charCode (`hsl(${(firstName.charCodeAt(0) * 31 + lastName.charCodeAt(0) * 7) % 360} 50% 70%)`) with white initials
   - Name: 13px, weight 700, `#0e0f0c`
   - Sport: 11px, weight 500, `#454745` (use `athletes[i].sports[0]` if available)
   - Medal chips (inline): pill spans — gold `{bg: #FFD166, text: #3d2a00}`, silver `{bg: #D9DFE4, text: #1a2330}`, bronze `{bg: #D78F5E, text: #2a1400}` — only render chip when count > 0; `padding: 2px 7px, borderRadius: 9999, fontSize: 11px, fontWeight: 700`

**Build check:** `npm run build` must pass.

---

## Task 5 — Restyle AthleteCard.tsx
**Status:** `completed`  
**Files:** `components/AthleteCard.tsx`  
**~80 lines**

Visual-only — biography expand/collapse and all data fields unchanged:

1. Container: `background: #fff, borderRadius: 20px, padding: 22px, boxShadow: rgba(14,15,12,0.10) 0 0 0 1px`; remove dark Tailwind classes
2. Avatar: change from 96×96px rounded-lg to 120px wide × 120px tall, `borderRadius: 16px`:
   - Thumbnail `<img>`: `width: 120, height: 120, objectFit: 'cover', borderRadius: 16, flexShrink: 0`
   - Fallback: gradient div using `hsl` from name charCode (same algorithm as CityTooltip), white initials, `fontSize: 120*0.36 = 43px`
3. Name: Inter 800, 19px, `#0e0f0c`
4. City/state: Inter 13px, weight 600, `#454745`
5. Sport badge: first item of `athlete.sports`, mint pill (`background: #e2f6d5, color: #163300, borderRadius: 9999, fontSize: 10px, fontWeight: 700, padding: 3px 9px, textTransform: uppercase`)
6. Birth year: extract year from `athlete.birthday` → `"Born {year}"`, `color: #868685`, 11px, weight 600 (keep beside sport badge)
7. Medal chips: replace emoji with pill badges (gold/silver/bronze same spec as CityTooltip); only show when count > 0; position top-right of card header area
8. Fun fact: `color: #454745`, italic (keep existing)
9. Read more / Show less: `color: #163300`, weight 700, 12px, no border/bg

**Build check:** `npm run build` must pass.

---

## Task 6 — Strip MapWithFilter filter UI
**Status:** `completed`  
**Files:** `components/MapWithFilter.tsx`  
**~200 lines removed, ~30 lines added/changed**

Remove all filter-rendering code; keep only filtering logic and map:

1. Remove from imports: `Image` from `next/image`, `AthleteSearch`, `CitySearch`
2. Remove from state: `pendingSports`, `sportOpen`, `dropdownRef`, `notifTimerRef` (keep `notification` state), `sportLabel` computation
3. Remove `useMemo` for `allAthletes` and `allCities`
4. Remove handler functions: `openSportPanel`, `closeSportPanel`, `applyAndClose`, `togglePending` (the sport-panel handlers — NOT `toggleGame`/`toggleSeason`/`toggleMedal`, those move to TopBar)
5. Remove `useEffect` for `dropdownRef` click-outside handler (the sport dropdown one only)
6. Remove JSX: entire "Row 1: primary filters" div + "Row 2: search inputs" div + entire sport dropdown panel
7. **Keep intact:** `filtered` useMemo, `onFilteredChange` useEffect, `handleCityDotClick`, `notification` state + toast div, `UsMap` render, `stateCities` computation
8. **Keep prop interface intact** (all existing props including `onContentPage`, `onClearAllFilters` — these will be removed in Task 8 to keep this task buildable)
9. Visual: change container from `className="relative w-full h-full flex flex-col bg-[#0f172a] rounded-lg border border-[#1A1A1A] p-4 gap-3 overflow-hidden"` to a transparent wrapper that renders a white map card:
   ```tsx
   <div className="relative w-full h-full flex">
     <div style={{ flex: 1, background: '#fff', borderRadius: 30, border: '1px solid rgba(14,15,12,0.10)', padding: 18, position: 'relative', overflow: 'hidden' }}>
       <UsMap ... />
     </div>
     {/* notification toast stays here */}
   </div>
   ```

**Build check:** `npm run build` must pass. (Props still in interface so no TS errors from callers.)

---

## Task 7 — MapContentSlider + ContentPage cleanup
**Status:** `completed`  
**Files:** `components/MapContentSlider.tsx`, `components/ContentPage.tsx`  
**~80 lines**

1. `components/ContentPage.tsx`:
   - Remove `onMapPage` prop from interface and component signature
   - Remove the header div containing the "← Map Page" button (first child of the flex container)
   - Change container bg from `bg-[#0f172a]` to transparent (`background: transparent` or just remove the bg class)
   - Empty state text: change to `color: #868685`
   - Keep the athlete grid and all other logic unchanged

2. `components/MapContentSlider.tsx`:
   - Remove `onContentPage` from `MapWithFilter` call (MapWithFilter no longer takes it after Task 6, but since we kept it in the interface it will just be an unused passed prop — that's TS fine until Task 8 removes it; alternatively remove from call here safely since the prop is just not-used)
   - Stop passing `onMapPage` to `ContentPage`: change `<ContentPage athletes={...} onMapPage={() => {...}} />` to `<ContentPage athletes={...} />`; since ContentPage no longer accepts the prop, this fixes the TS error
   - Container outer div: remove `overflow-hidden` dark styles (already minimal in this component)
   - The `handleCityDotClick` and `clickedCity` logic stays unchanged

**Build check:** `npm run build` must pass.

---

## Task 8 — ResizableLayout rewrite (wires everything together)
**Status:** `completed`  
**Files:** `components/ResizableLayout.tsx`, `components/MapWithFilter.tsx` (interface cleanup), `components/MapContentSlider.tsx` (interface cleanup)  
**~200 lines**

This is the final integration task. It also removes the now-dead prop plumbing cleaned up throughout:

1. **`components/ResizableLayout.tsx`** — full rewrite preserving all existing logic:
   - Add imports: `TopBar`, `SportModal`, `AthleteSearch`, `AthleteEntry` from `@/components/AthleteSearch`, `CitySearch`, `CityEntry`, `STATE_NAMES` from `@/components/CitySearch`
   - Add state: `sportOpen: boolean` (init false), `pendingSports: Set<string>` (init new Set)
   - Add memos: `allAthletes` (flat list from cities, same logic as old MapWithFilter), `allCities` (deduplicated, same logic)
   - Add handlers: `openSportModal()`, `closeSportModal()`, `applyAndClose()` (sets sportFilter + closes), `togglePendingSport(sport)`, `clearPendingSports()`
   - Root `<main>` style: change from dark gradient to `background: #fafaf7`; change `p-4` padding to 0
   - Layout structure (replace current body):
     ```
     <main style={{ background: '#fafaf7', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
       <TopBar ... />
       {/* Search row */}
       <div style={{ background: '#fff', borderBottom: '1px solid rgba(14,15,12,0.10)', padding: '14px 32px', display: 'flex', gap: 16, flexShrink: 0 }}>
         <AthleteSearch ... />
         <CitySearch ... />
       </div>
       {/* Map + Chat row */}
       <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', padding: '24px 0 24px 32px' }}>
         <MapContentSlider ... />
         {/* drag separator */}
         <div onMouseDown={onSeparatorMouseDown} style={{ ... }}>
           <div style={{ background: 'rgba(14,15,12,0.10)', ... }} />
           {dots}
         </div>
         {/* Chat panel */}
         <div style={{ width: chatWidth, flexShrink: 0, height: '100%', paddingRight: 32 }}>
           <Chat onApplyFilters={applyAgentFilters} />
         </div>
       </div>
       {sportOpen && <SportModal open pendingSports={pendingSports} onToggle={togglePendingSport} onApply={applyAndClose} onCancel={closeSportModal} onClearAll={clearPendingSports} />}
     </main>
     ```
   - Stop passing `onClearAllFilters` to `MapContentSlider`
   - Pass `onOpenSportModal={openSportModal}` to `TopBar`
   - Pass `allAthletes`/`allCities` to search row inputs
   - Separator: restyle pill from `bg-[#334155]` to `rgba(14,15,12,0.10)`, dots from `#475569` to `rgba(14,15,12,0.20)`

2. **`components/MapContentSlider.tsx`** (interface cleanup only):
   - Remove `onClearAllFilters` from `MapContentSliderProps` interface
   - Remove `onClearAllFilters` from `MapWithFilter` call
   - Remove `onContentPage` from `MapWithFilter` call (if still present)

3. **`components/MapWithFilter.tsx`** (interface cleanup only):
   - Remove `onContentPage` and `onClearAllFilters` from the prop interface and destructuring

**Build check:** `npm run build` must pass. This is the final task — full Heritage redesign complete.

---

## Dependency Order

```
Task 1 (foundation + TopBar)
  └── Task 2 (sports + SportModal)
        └── Task 6 (strip MapWithFilter)
              └── Task 7 (MapContentSlider + ContentPage)
                    └── Task 8 (ResizableLayout — final integration)
Task 1 also unblocks:
  └── Task 3 (Chat restyle — uses lucide-react)
Task 4 (CityTooltip) — independent, any time after Task 1 (font available)
Task 5 (AthleteCard)  — independent, any time after Task 1
```

Tasks 3, 4, 5 can be done in any order after Task 1. Tasks 6 → 7 → 8 must be sequential.
