# CL: Chat "Press to Play" Button and Follow-up Questions

Design doc: `docs/ddd_design/DES_chat_play_button_and_followups.md`
Requirements: `docs/ddd_requirement/REQ_chat_play_button_and_followups.md`

---

## Tasks

### Task 1 — Key-based city filter: update `CitySearch` + `MapWithFilter` city internals
**Status:** completed  
**Files:** `components/CitySearch.tsx`, `components/MapWithFilter.tsx`  
**Est. diff:** ~80–100 lines

Refactor the city filter from numeric-ID-based (`Set<number>`) to composite-key-based (`Set<string>`, keys are `"city|state"`). This is a prerequisite for expressing the preset city as a plain string literal.

**`CitySearch.tsx`**
- `CityEntry`: replace `id: number` with `key: string` (`"city|state"` format)
- `CitySearchProps`: rename `selectedIds → selectedKeys` (`Set<string>`); change `onSelect`/`onRemove` signatures to `(key: string) => void`
- Chip rendering: iterate `[...selectedKeys]`; look up entry via `cities.find(c => c.key === key)`
- Dropdown: filter `!selectedKeys.has(c.key)`; call `onSelect(c.key)` on select

**`MapWithFilter.tsx`**
- `allCities` useMemo: generate `key: \`${c.city}|${c.state}\`` on each entry; drop numeric `id`
- Rename `selectedCityIds: Set<number>` state → `selectedCityKeys: Set<string>`
- Drop the `selectedCityKeys` conversion memo (it was converting IDs → key strings; now the state is already key strings)
- Update `handleCitySelect`/`handleCityRemove` to accept/work with string keys
- Update `CitySearch` call site: pass `selectedKeys={selectedCityKeys}`, `onSelect={handleCitySelect}`, `onRemove={handleCityRemove}`

_Compiles after this task: MapWithFilter still owns city state; no other files change._

---

### Task 2 — Lift filter state from `MapWithFilter` to `MapContentSlider`
**Status:** completed  
**Files:** `components/MapWithFilter.tsx`, `components/MapContentSlider.tsx`  
**Est. diff:** ~120–150 lines

Move all committed filter state out of `MapWithFilter` and into `MapContentSlider` (temporary home before the final lift to `ResizableLayout`).

**`MapWithFilter.tsx`**
- Expand props interface: add all filter values + setter callbacks:
  - `selectedState: string`, `onStateSelect: (s: string) => void`
  - `gameFilter: Set<string>`, `onGameFilter: (s: Set<string>) => void`
  - `seasonFilter: Set<string>`, `onSeasonFilter: (s: Set<string>) => void`
  - `medalFilter: Set<string>`, `onMedalFilter: (s: Set<string>) => void`
  - `sportFilter: Set<string>`, `onSportFilter: (s: Set<string>) => void`
  - `selectedAthleteIds: Set<number>`, `onAthleteSelect: (id: number) => void`, `onAthleteRemove: (id: number) => void`
  - `selectedCityKeys: Set<string>`, `onCitySelect: (key: string) => void`, `onCityRemove: (key: string) => void`
- Remove the 7 `useState` calls for the above state atoms
- Toggle helpers (`toggleGame`, `toggleSeason`, `toggleMedal`, `handleAthleteSelect`, etc.) rewritten to call the prop setter directly with the next `Set` value
- Keep `sportOpen`, `pendingSports`, `dropdownRef`, `openSportPanel`, `closeSportPanel`, `applyAndClose`, `togglePending` as local state (UI-only)
- Pass `sportFilter` to `applyAndClose`: call `onSportFilter(pendingSports)` instead of `setSportFilter`

**`MapContentSlider.tsx`**
- Add all 7 filter state atoms with their original defaults
- Add `handleAthleteSelect`, `handleAthleteRemove`, `handleCitySelect`, `handleCityRemove` handlers
- Update `MapWithFilter` call site to pass all new props

_Compiles after this task: MapContentSlider owns all filter state; app behaviour unchanged._

---

### Task 3 — Lift state from `MapContentSlider` to `ResizableLayout` + define `applyPreset`
**Status:** completed  
**Files:** `components/MapContentSlider.tsx`, `components/ResizableLayout.tsx`, `components/Chat.tsx`  
**Est. diff:** ~100–130 lines

Move filter state + `showContent` to their final home in `ResizableLayout`. Define `applyPreset`. Thread `onApplyPreset` into `Chat` as an optional prop (UI will be added in Task 4).

**`MapContentSlider.tsx`**
- Remove all filter `useState` + handler functions (they move to `ResizableLayout`)
- Remove `showContent` `useState`
- Expand props interface: accept all filter props + `showContent: boolean`, `onShowContent: (v: boolean) => void`
- Forward all props to `MapWithFilter`; use `showContent`/`onShowContent` for slide logic
- `filteredAthletes` useState stays here

**`ResizableLayout.tsx`**
- Add all 7 filter `useState` atoms (same defaults as before)
- Add `showContent: boolean` useState (default `false`)
- Add handler functions: `handleAthleteSelect`, `handleAthleteRemove`, `handleCitySelect`, `handleCityRemove`
- Define `LA_PRESET` constant and `applyPreset` function (sets all 7 state atoms + `showContent=false`)
- Pass all filter props + `showContent`/`onShowContent` to `MapContentSlider`
- Pass `onApplyPreset={applyPreset}` to `Chat`

**`Chat.tsx`**
- Add `onApplyPreset?: () => void` as an optional prop (makes ResizableLayout's call valid without breaking existing usages)
- No UI changes yet

_Compiles after this task: applyPreset is wired end-to-end; Chat accepts the prop silently._

---

### Task 4 — Render "Press to play" button + follow-up chips in `Chat`
**Status:** completed  
**Files:** `components/Chat.tsx`  
**Est. diff:** ~55–70 lines

Implement the visible UI: button and chips rendered after each fully-delivered assistant message.

**`Chat.tsx`**
- Add module-level `FOLLOWUP_QUESTIONS` constant (3 static strings)
- Refactor `send()` into `sendText(text: string)`: moves the body of `send` into the helper; the existing input-based `send` calls `sendText(input.trim())`
- In the assistant message render branch, after the message bubble and _outside_ the `msg.typing` guard, render:
  - A "▶ Press to play" pill button (`bg-[#0B9FEA]`, `rounded-full`, `w-fit`, calls `onApplyPreset?.()`)
  - Three chip buttons (dark `bg-[#1e293b]`, `border-l-2 border-[#0B9FEA]`, `rounded-lg`, `text-[#94A3B8]`) each calling `sendText(q)`
- Wrap the entire button+chips block in `{!msg.typing && onApplyPreset && (…)}` so it only appears on completed assistant messages and only when the preset callback is wired

_Compiles after this task: feature is fully functional._
