# REQ — Clear All Filters Button

## Summary

Add a **"Clear All Filters"** button to the filter bar, positioned immediately next to the Sport filter dropdown. Clicking the button resets every active filter and both search inputs to their initial "show everything" state in a single action.

---

## Actors

- **User** — anyone interacting with the map filter bar.

---

## Primary Flow

1. User has applied one or more filters (or none).
2. User clicks **"Clear All Filters"**.
3. All filters and search inputs reset instantly to their default state:
   - **Game**: both Olympian and Paralympian selected
   - **Season**: both Summer and Winter selected
   - **Medals**: Gold, Silver, Bronze, and No Medal all selected
   - **Sport**: empty selection (meaning all disciplines are shown)
   - **Athlete search**: input text cleared, all selected athlete tags removed
   - **City search**: input text cleared, all selected city tags removed
4. The map re-renders to show all athletes with no filtering applied.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | The button is always visible in the filter bar, positioned directly next to (adjacent to) the Sport filter trigger. |
| AC-2 | Clicking the button resets the Game filter to both Olympian and Paralympian. |
| AC-3 | Clicking the button resets the Season filter to both Summer and Winter. |
| AC-4 | Clicking the button resets the Medal filter to all four values (Gold, Silver, Bronze, No Medal). |
| AC-5 | Clicking the button resets the Sport filter selection to empty (all disciplines shown). |
| AC-6 | Clicking the button clears all selected athlete tags **and** the typed text in the athlete search input. |
| AC-7 | Clicking the button clears all selected city tags **and** the typed text in the city search input. |
| AC-8 | After the reset, the map immediately reflects the cleared state (no stale filtered view). |

---

## Edge Cases

- **Nothing filtered**: Button is visible but clicking it is a no-op visually — state is already at defaults. No error or feedback needed.
- **Sport panel open**: If the Sport dropdown is open when the button is clicked, the dropdown may close as a side effect of state reset, or remain open — either is acceptable as long as the Sport selection is cleared.

---

## Non-Functionals

- Reset must be synchronous from the user's perspective — no loading state or delay.
- The button should be visually consistent with the existing filter bar style (Tailwind dark slate theme).

---

## Out of Scope

- Confirmation dialog or undo capability.
- Per-filter reset buttons (only a single "clear all" button is being added).
- Persisting filter state across sessions or page reloads.
- Any changes to the preset (`LA_PRESET`) logic in `ResizableLayout`.
- Accessibility enhancements beyond what the existing filter bar already provides.

---

## Open Questions / Assumptions

- **Assumption**: "next to Sport filter" means in the same row as the Sport trigger button, immediately to its right (or left — exact side is a design decision).
- **Assumption**: The Sport dropdown's internal pending state (`pendingSports`) is also reset when the button is clicked, so re-opening the dropdown after clear shows an empty selection.
