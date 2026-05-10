# CL — Clear All Filters Button

Design: `docs/ddd_design/DES_clear_all_filters_button.md`
Requirements: `docs/ddd_requirement/REQ_clear_all_filters_button.md`

---

## Tasks

### Task 1 — Wire clearSignal into leaf components and thread reset handler through the component tree  
**Status:** completed  
**Files:** `components/AthleteSearch.tsx`, `components/CitySearch.tsx`, `components/MapWithFilter.tsx`, `components/MapContentSlider.tsx`, `components/ResizableLayout.tsx`  
**Est. diff:** ~55 lines

**AthleteSearch.tsx**
- Add optional `clearSignal?: number` to `AthleteSearchProps`
- Destructure it in the component
- Add `useEffect(() => { setQuery(''); setIsOpen(false) }, [clearSignal])`

**CitySearch.tsx**
- Same three changes as `AthleteSearch.tsx` (same pattern)

**MapWithFilter.tsx**
- Add `onClearAllFilters: () => void` and `searchClearSignal: number` to the props interface and destructure them
- Add `clearAllFilters()` handler: calls `setPendingSports(new Set())`, `setSportOpen(false)`, `onClearAllFilters()`
- Insert ghost-text button element immediately after the `<div ref={dropdownRef}>` Sport block and before the `onContentPage` button:
  ```tsx
  <button
    onClick={clearAllFilters}
    className="text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
    style={{ fontFamily: "'Geist', sans-serif" }}
  >
    Clear All Filters
  </button>
  ```
- Pass `clearSignal={searchClearSignal}` to `<AthleteSearch>` and `<CitySearch>`

**MapContentSlider.tsx**
- Add `onClearAllFilters: () => void` and `searchClearSignal: number` to `MapContentSliderProps` and destructure them
- Pass both props through to `<MapWithFilter>`

**ResizableLayout.tsx**
- Add `const [searchClearSignal, setSearchClearSignal] = useState(0)`
- Add `handleClearAllFilters()` that resets all six filter Sets to their defaults and increments `searchClearSignal`
- Pass `onClearAllFilters={handleClearAllFilters}` and `searchClearSignal={searchClearSignal}` to `<MapContentSlider>`

**Acceptance check**
1. All disciplines set, then "Clear All Filters" → Game/Season/Medals/Sport/Athletes/Cities all back to defaults
2. Both search inputs show empty text and no tags after click
3. Sport panel open when clicked → panel closes, reopening shows empty selection
4. Button visible when no filters are active; click causes no error
