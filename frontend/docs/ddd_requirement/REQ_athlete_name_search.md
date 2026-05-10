---
title: Athlete Name Search Filter
status: final
date: 2026-05-09
---

# REQ: Athlete Name Search Filter

## Summary

Add a name-search field to the right of the existing Sport filter in the map filter bar. Users type a first or last name to get a live dropdown of matching athletes, select one or more (each shown as a removable chip inside the input), and the map restricts to only those athletes' hometown dots (combined with all other active filters). When no athletes are selected the map behaves exactly as before.

---

## Actors

- **Map viewer** — any user browsing the interactive athlete hometown map.

---

## Primary Flow

1. User sees the filter bar: Game | Season | Medals | Sport | **[Search athletes…]** | Content Page →
2. User types one or more characters in the search field.
3. A dropdown opens beneath the field listing athletes whose first or last name contains the typed string (case-insensitive, partial match).
4. Already-selected athletes are hidden from the dropdown.
5. User clicks an athlete in the dropdown — a chip (`× John Smith`) appears inside the input; the input text clears; the dropdown closes (or updates if text remains).
6. User can continue typing to add more athletes.
7. User removes an athlete by clicking the `×` on their chip.
8. The map updates immediately on every selection/removal.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | The search field is positioned to the right of the Sport filter, left of the Content Page button. |
| AC-2 | Typing any substring of an athlete's first or last name (case-insensitive) shows matching athletes in a dropdown. |
| AC-3 | Each dropdown row shows the athlete's full name only (no sport, city, or other metadata). |
| AC-4 | Selecting an athlete adds a chip inside the input field with `× Name` format. |
| AC-5 | The selected athlete is immediately removed from the dropdown list. |
| AC-6 | Clicking `×` on a chip removes the athlete from the selection; the map updates immediately. |
| AC-7 | Multiple athletes can be selected (no upper limit defined). |
| AC-8 | When ≥ 1 athlete is selected, the map shows only cities that contain at least one of the selected athletes **and** that athlete also passes all other active filters (Game, Season, Medals, Sport). |
| AC-9 | When 0 athletes are selected, the map behaves identically to before this feature — all athletes passing the other filters are shown. |
| AC-10 | Clicking outside the dropdown closes it without clearing the input or selections. |
| AC-11 | Searching with zero results in the dropdown shows a "No results" empty state message. |

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Selected athlete is excluded by another filter (e.g. Season toggle) | That athlete's city dot is hidden; the chip remains in the input so the user can see their selection even if it yields no visible result. |
| Two athletes share the same full name | Both appear as separate entries in the dropdown; selecting one does not affect the other. |
| All other filters restrict to zero athletes | Map shows empty regardless of search selections. |
| Input cleared after chips are added | Chips remain; dropdown closes. Clearing an empty input has no effect. |

---

## Non-Functionals

- **Performance**: Filtering is done client-side over the in-memory dataset (no additional API calls). Matching should feel instant (< 50 ms) for datasets up to ~10 000 athletes.
- **Accessibility**: The search input has an accessible label or `aria-label`. Chips include an accessible remove button (`aria-label="Remove John Smith"`).

---

## Integrations & Data

- No new API calls. All athlete data (`first_name`, `last_name`) is already available in the `cities` prop passed to `MapWithFilter`.
- The full athlete list for search is derived from all cities × their athletes arrays (the unfiltered source), so users can search for any athlete regardless of other active filters. The **map visibility** of that athlete still depends on the other filters.

---

## Out of Scope

- Searching by city, state, sport, medal count, or any field other than first/last name.
- Fuzzy / phonetic matching (exact substring match is sufficient for v1).
- Keyboard navigation inside the dropdown (arrow keys, Enter to select).
- Persisting search selections across page reloads.
- A maximum cap on the number of selected athletes.
- Showing chips below the input instead of inside it.
