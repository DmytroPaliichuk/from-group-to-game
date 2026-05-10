# REQ: Athlete Cards on Content Page

## Summary

The Content Page currently shows only a "Map Page" back-button stub. This feature adds a responsive grid of athlete cards that mirror the filtered set visible on the map, so that every filter applied on the Map Page (game type, season, medals, sport disciplines, athlete search, city search, and state selection) is reflected in the cards the user sees when they navigate to the Content Page.

---

## Actors

- **End user** — browses the map with filters applied, then navigates to the Content Page to see the same athletes presented as cards.

---

## Primary Flow

1. User is on the Map Page and applies any combination of filters (game, season, medal, sport discipline, athlete search, city search).
2. User clicks the "Content Page >>" button.
3. The Content Page slides into view and displays a responsive grid of athlete cards — one card per athlete — matching exactly the athletes visible on the map under the active filters.
4. User can navigate back to the Map Page, change filters, and return; the cards update to reflect the new filter state.

---

## Athlete Card Contents

Each card must display the following fields:

| Field | Source | Notes |
|---|---|---|
| Athlete photo | `thumbnail` URL | See image fallback below |
| First + Last name | `first_name`, `last_name` | Displayed together |
| City | `city` from the athlete's hometown | City name only |
| Sport(s) | `sports[]` array | All sports joined (e.g. "Swimming, Water Polo") |
| Medals | `medals.gold`, `medals.silver`, `medals.bronze` | Medal icon + count; hide zero values |

### Medal Display

Show gold, silver, and bronze medal icons (🥇 🥈 🥉) each followed by their count. Do not display an icon if the count is zero. An athlete with no medals shows no medal icons.

### Image Fallback

When the athlete's `thumbnail` URL is empty or the image fails to load, display a placeholder generic silhouette or avatar so all cards maintain a consistent layout.

---

## Card Layout

- **Responsive grid**: Multiple columns adapting to the available container width (e.g., 2–4 columns depending on screen width).
- **All-at-once scroll**: All filtered athletes are rendered in a single scrollable container. No pagination.
- **Cards are display-only**: No click interaction is required.

---

## Filters Reflected in Cards

The cards must respond to all existing map filters:

- Game type (Olympian / Paralympian toggle)
- Season (Summer / Winter toggle)
- Medal filter (gold / silver / bronze / no-medal toggles)
- Sport disciplines dropdown
- Athlete name search (selected athlete chips)
- City search (selected city chips)
- State selection (clicking a state on the map)

The cards show exactly the same athletes that would appear as dots on the map under the same filter combination.

---

## Empty State

When no athletes match the active filters, display a centered message such as:

> "No athletes match the current filters."

No reset button is required.

---

## Sort Order

Cards appear in the same order as the athlete data is provided by the API. No user-controllable sorting is required.

---

## Acceptance Criteria

1. Navigating to the Content Page shows one card per filtered athlete, matching the map's visible athletes.
2. Each card displays: athlete photo (or placeholder), full name, city, all sports joined with commas, and medal icons with non-zero counts.
3. Changing any filter on the Map Page and returning to the Content Page updates the card grid to reflect the new filter state.
4. When no athletes match, a centered "No athletes match the current filters." message is shown.
5. When an athlete's thumbnail is missing or fails to load, a placeholder is shown instead of a broken image.
6. The grid is scrollable and renders all filtered athletes at once.

---

## Out of Scope

- Clicking a card to open a detail view or navigate to the map.
- User-controlled sorting (by name, medals, etc.).
- Pagination.
- A "Clear all filters" button on the Content Page.
- Displaying additional athlete metadata beyond image, name, city, sports, and medals.
- Any backend or API changes.

---

## Open Questions / Assumptions

- **Filter state sharing**: The filter logic currently lives entirely inside `MapWithFilter`. The computed `filtered` athletes list must be lifted to `MapContentSlider` (or a shared parent) so it can be passed to `ContentPage`. This is an architectural concern for design, not a requirement change.
- **Placeholder asset**: The specific placeholder graphic (silhouette, initials avatar, etc.) is a design decision, not locked here. Any consistent fallback satisfies the requirement.
