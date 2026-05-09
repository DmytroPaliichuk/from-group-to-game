# REQ: Medal Filter — All-Selected Default with Exclusion Logic

## Summary

Change the medal filter in `MapWithFilter` from an opt-in inclusion model (start empty, select to include) to an opt-out exclusion model (start fully selected, deselect to exclude). All four medal buttons — gold, silver, bronze, and no-medal — are active by default, showing every athlete. Deselecting a button hides athletes who belong to that medal category.

## Actors

- End user browsing the athlete hometown map.

## Current Behavior (for reference)

- `medalFilter` starts as an empty `Set<string>`.
- Empty set → show all athletes (no filter applied).
- Selecting a medal adds it to the set; the filter then requires the athlete to hold **all** selected medals (AND logic).
- The "Ø" (no-medal) button has no `onClick` handler and is non-functional.

## Desired Behavior

### 1. Default state — all selected

On first render (and on any hard refresh), all four medal buttons are in the **selected** state:

| Button | Selected by default |
|--------|---------------------|
| Gold | ✓ |
| Silver | ✓ |
| Bronze | ✓ |
| No medal (Ø) | ✓ |

With all four selected, **every athlete is visible** — equivalent to "no filter applied."

### 2. Toggling a button — exclusion logic

Clicking a selected button **deselects** it. Deselecting a medal type **excludes** athletes who belong to that category:

- Gold deselected → hide athletes where `gold > 0`.
- Silver deselected → hide athletes where `silver > 0`.
- Bronze deselected → hide athletes where `bronze > 0`.
- No-medal deselected → hide athletes where `gold = 0 AND silver = 0 AND bronze = 0`.

Clicking a deselected button **re-selects** it (re-includes that category).

Multiple buttons can be deselected simultaneously; an athlete is hidden if they belong to **any** deselected category.

### 3. All buttons deselected

When no button is selected, no athletes pass the filter → the map shows zero athlete dots. This is intentional and consistent behavior (not a reset fallback).

### 4. No-medal button ("Ø") must be functional

The no-medal button must respond to click events the same way the other three buttons do. It is currently broken (no `onClick`).

### 5. Visual state

Selected buttons: cyan border (`#06B6D4`), full opacity.  
Deselected buttons: gray border (`#475569`), reduced opacity (55%).  
No change to existing visual language — only the initial state and filter logic change.

## Acceptance Criteria

1. On page load all four medal buttons render as selected (cyan border, full opacity).
2. All athletes are visible on load (same as today's "empty filter shows all").
3. Deselecting gold hides athletes who have `gold > 0`; re-selecting gold restores them.
4. Deselecting silver, bronze, or no-medal behaves analogously.
5. Deselecting multiple buttons hides athletes from any deselected category (union of exclusions).
6. With all four buttons deselected, zero athlete dots appear on the map.
7. The "Ø" button toggles like the other three medal buttons.
8. All other filters (Game, Season, Sport) continue to work independently and in combination with the updated medal filter.

## Edge Cases

| Scenario | Expected result |
|----------|-----------------|
| All deselected | Map shows no athletes |
| An athlete has both gold and silver; gold is deselected | Athlete is hidden (belongs to excluded category) |
| An athlete has no medals; no-medal button is deselected | Athlete is hidden |
| All reselected after all were deselected | All athletes re-appear |

## Out of Scope

- Changing the visual design of the medal buttons (shape, images, size, color palette).
- Adding new medal types or categories.
- Persisting filter state across page reloads (e.g., URL params, localStorage).
- Any changes to the Game, Season, or Sport filters.
- Server-side filtering — this remains a client-side operation.
