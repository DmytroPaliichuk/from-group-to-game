# DES: Medal Filter — All-Selected Default with Exclusion Logic

**Requirement:** `docs/ddd_requirement/REQ_medal_filter_default_selected.md`

## Scope

All changes are confined to a single file: `components/MapWithFilter.tsx`. No new files, no API changes, no new abstractions.

## Changes

### 1. Initial state — populate the Set with all four keys

```ts
// Before
const [medalFilter, setMedalFilter] = useState(new Set<string>())

// After
const [medalFilter, setMedalFilter] = useState(
  new Set(['gold', 'silver', 'bronze', 'noMedal'])
)
```

`toggleMedal()` is unchanged — it already adds/removes from the Set correctly.

### 2. Filter predicate — exclusion logic

Replace line 142 in `MapWithFilter.tsx`:

```ts
// Before (inclusion — show athletes who have ALL selected medals)
const medalMatch =
  medalFilter.size === 0 ||
  [...medalFilter].every(m => a.medals[m as keyof typeof a.medals] > 0)

// After (exclusion — hide athletes who belong to any deselected category)
const isNoMedal =
  a.medals.gold === 0 && a.medals.silver === 0 && a.medals.bronze === 0
const medalMatch =
  (medalFilter.has('gold')    || a.medals.gold === 0) &&
  (medalFilter.has('silver')  || a.medals.silver === 0) &&
  (medalFilter.has('bronze')  || a.medals.bronze === 0) &&
  (medalFilter.has('noMedal') || !isNoMedal)
```

**Logic:** for each category, the athlete passes that check when either (a) the category is still selected, or (b) the athlete doesn't belong to it. An athlete is visible only when they pass every check — i.e., they aren't excluded by any deselected category.

| All selected | → all pass | map shows everyone |
|---|---|---|
| Gold deselected | → `has('gold')` is false; athletes with `gold > 0` fail | gold medalists hidden |
| All deselected | → no athlete satisfies every check | map is empty |

### 3. Wire up and style the Ø button

The Ø button currently has no `onClick` and static gray/disabled styling. It needs to behave like the other three medal buttons.

```tsx
// Before (static, no handler)
<button className="w-12 h-12 rounded-full border-2 border-[#475569] opacity-55 bg-[#1e293b] flex items-center justify-center">
  <span className="text-[#E2E8F0] text-xl font-semibold">Ø</span>
</button>

// After (reactive, same pattern as gold/silver/bronze buttons)
<button
  onClick={() => toggleMedal('noMedal')}
  className={`w-12 h-12 rounded-full border-2 bg-[#1e293b] flex items-center justify-center transition-all
    ${medalFilter.has('noMedal') ? 'border-[#06B6D4] opacity-100' : 'border-[#475569] opacity-55'}`}
>
  <span className="text-[#E2E8F0] text-xl font-semibold">Ø</span>
</button>
```

## Data flow

```
User clicks medal button
  → toggleMedal('gold' | 'silver' | 'bronze' | 'noMedal')
    → Set updated (key added or removed)
      → filtered recomputed via new exclusion predicate
        → UsMap re-renders with updated athlete dots
```

## Key name contract

| Internal key | Meaning |
|---|---|
| `'gold'` | Athlete has `medals.gold > 0` |
| `'silver'` | Athlete has `medals.silver > 0` |
| `'bronze'` | Athlete has `medals.bronze > 0` |
| `'noMedal'` | Athlete has `gold = 0 AND silver = 0 AND bronze = 0` |

Note: an athlete can belong to multiple categories (e.g., both `'gold'` and `'silver'`). They are hidden if ANY of their categories is deselected.

## Testing

Manual verification path:
1. Load the page — all four buttons are cyan/full-opacity; all athletes appear.
2. Deselect gold — only athletes with zero gold medals remain visible.
3. Re-select gold — all athletes return.
4. Deselect Ø — athletes with no medals at all are hidden.
5. Deselect all four — map shows zero dots.
6. Confirm Game/Season/Sport filters still work in combination.
