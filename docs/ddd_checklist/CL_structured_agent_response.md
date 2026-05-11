# CL: Structured Agent Response — Implementation Checklist

**Design:** `docs/ddd_design/DES_structured_agent_response.md`
**Requirement:** `docs/ddd_requirement/REQ_structured_agent_response.md`

---

## Dependency order

```
Task 1 (backend)       — independent
Task 2 (map components) — independent
Task 3 (Chat)          — independent
Task 4 (ResizableLayout) — depends on Task 2 and Task 3
```

---

## Tasks

### Task 1 — Backend: extend ChatResponse and parse agent JSON
**Status:** `completed`
**Files:** `backend/main.py`

- [ ] Add `filters: dict[str, list[str]] = {}` and `followups: list[str] = []` fields to `ChatResponse`
- [ ] In `chat()`, assign `raw = "".join(parts)` instead of returning inline
- [ ] Wrap a `json.loads(raw)` call in a `try/except (json.JSONDecodeError, KeyError)` block
- [ ] On parse success: return `ChatResponse(reply=parsed["text"], filters=parsed.get("filters", {}), followups=parsed.get("followups", []))`
- [ ] On parse failure: return `ChatResponse(reply=raw)` (existing `filters`/`followups` defaults cover the rest)

---

### Task 2 — MapWithFilter + MapContentSlider: athlete name filter prop
**Status:** `completed`
**Files:** `frontend/components/MapWithFilter.tsx`, `frontend/components/MapContentSlider.tsx`

**MapWithFilter.tsx**
- [ ] Add `selectedAthleteNames?: Set<string>` to the component's props destructuring and its surrounding props type
- [ ] Extend the `selectedAthleteKeys` memo to handle name-based selection: when `selectedAthleteNames` is non-empty, add composite keys (`firstName|lastName|city|state`) for every `allAthletes` entry whose `fullName` is in the set
- [ ] Update the `selectedAthleteKeys` memo to return `null` only when both `selectedAthleteIds.size === 0` and `selectedAthleteNames` is empty/undefined (currently returns `null` only on `selectedAthleteIds.size === 0`)
- [ ] Add `selectedAthleteNames` to the memo's dependency array

**MapContentSlider.tsx**
- [ ] Add `selectedAthleteNames: Set<string>` and `onAthleteNamesChange: (s: Set<string>) => void` to `MapContentSliderProps`
- [ ] Destructure and forward both new props to `<MapWithFilter>`

---

### Task 3 — Chat: structured response handling and per-message followups
**Status:** `completed`
**Files:** `frontend/components/Chat.tsx`

- [ ] Add `followups?: string[]` to the `Message` interface
- [ ] In the localStorage persistence `useEffect`, strip `followups` from each message before serialising (`.map(({ followups: _f, ...rest }) => rest)`)
- [ ] Add `onApplyFilters?: (filters: Record<string, string[]>) => void` to the component's props and its type annotation
- [ ] In `sendText`, change the `data` type annotation to `{ reply: string; filters?: Record<string, string[]>; followups?: string[] }`
- [ ] After a successful `res.ok` response, call `onApplyFilters?.(data.filters)` when `data.filters` is non-empty (i.e. `Object.keys(data.filters).length > 0`)
- [ ] Pass `followups: data.followups ?? []` when adding the assistant message to state
- [ ] Delete the hardcoded `FOLLOWUP_QUESTIONS` constant
- [ ] Replace the `onApplyPreset`-gated followup block with a per-message block: render `msg.followups` buttons when `!msg.typing && msg.followups && msg.followups.length > 0`; each button calls `sendText(q)` and is `disabled={isLoading}`
- [ ] Keep the "Press to play" button and its `onApplyPreset` gate unchanged

---

### Task 4 — ResizableLayout: agent filter application
**Status:** `completed`
**Files:** `frontend/components/ResizableLayout.tsx`
**Depends on:** Task 2 (MapContentSlider props), Task 3 (Chat `onApplyFilters` prop)

- [ ] Add `const [selectedAthleteNames, setSelectedAthleteNames] = useState(new Set<string>())`
- [ ] Add module-level helper `mapMedalValue(v: string): string` — lowercases the value and maps `"No Medal"` → `"noMedal"`
- [ ] Add module-level helper `buildCityKeys(cityNames: string[], cities: any[]): Set<string>` — matches city names case-insensitively against `c.city` and returns a set of `"city|state"` strings
- [ ] Add `applyAgentFilters(filters: Record<string, string[]>)` — applies each present key: `game` → `setGameFilter`, `season` → `setSeasonFilter`, `medal` → `setMedalFilter` (via `mapMedalValue`), `state` → `setSelectedState` (first element or `""`), `sport` → `setSportFilter`, `athlete` → `setSelectedAthleteNames` + clear `selectedAthleteIds`, `city` → `setSelectedCityKeys` (via `buildCityKeys`); then call `setShowContent(false)` and increment `searchClearSignal`
- [ ] In `handleClearAllFilters`, add `setSelectedAthleteNames(new Set<string>())`
- [ ] Pass `selectedAthleteNames={selectedAthleteNames}` and `onAthleteNamesChange={setSelectedAthleteNames}` to `<MapContentSlider>`
- [ ] Pass `onApplyFilters={applyAgentFilters}` to `<Chat>`
