# REQ: Dot Click Navigates to Content Page

## Summary

When a user clicks a blue city dot on the US map, the UI slides to the Content Page and displays only the athletes from that specific city who also match the currently active filters. Pressing "Map Page" returns to the map in its exact prior state.

---

## Actors

- **End user** — views the map, clicks city dots, browses athletes on the Content Page.

---

## Primary Flow

1. User views the map with zero or more active filters (game, season, medal, sport, etc.).
2. User clicks a blue city dot on the map.
3. The UI slides to the Content Page (same CSS `translateX` transition already used by the "Content Page >>" button).
4. Content Page shows only athletes who are **both** from the clicked city **and** match all currently active filters.
5. User clicks "Map Page" button.
6. The UI slides back to the Map.
7. The map is visually and state-wise identical to step 1 — same selected state, same active filters, same city/athlete search selections, no dot color changes.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC1 | Clicking any blue city dot triggers the slide to Content Page. |
| AC2 | Content Page shows only athletes whose `city` and `state` match the clicked dot's city and state. |
| AC3 | Active filters (game, season, medal, sport, athlete search, city search) are applied on top of the city restriction — the intersection is shown. |
| AC4 | Pressing "Map Page" restores the map to its exact prior state: same `selectedState`, same filter sets, same search selections, same `showContent = false`. |
| AC5 | City dots show no visual change (no highlight, no color change) as a result of clicking. |
| AC6 | No click animation or visual feedback plays on the dot itself — navigation starts immediately. |

---

## Errors & Edge Cases

### No athletes match after filtering

If the clicked city has athletes but all are filtered out by the current active filters:

- **Do not navigate** to Content Page.
- **Display a brief notification** (e.g. a small transient message near the dot or on the filter bar) telling the user no athletes match the current filters for that city.
- The map stays on screen; no state changes.

### City dot with zero athletes (data edge case)

- A dot should not be rendered for a city with no athletes (this is already the case — dots come from the `cities` array which only contains cities with athletes).
- If this edge case is ever reached, treat it as "no athletes match" per above.

---

## Out of Scope

- Changing any filter values when a dot is clicked.
- Displaying a tooltip with athlete counts on hover (already handled by `CityTooltip`).
- Highlighting or persisting a "last-visited dot" after returning to the map.
- Deep-linking or URL-based navigation to a specific city's content.
- Any changes to the "Content Page >>" button behavior — it continues to work as before.
- Mobile / touch interaction specifics.

---

## Open Questions / Assumptions

- **Notification style for empty state:** The requirements specify a notification but do not prescribe the exact UI component (toast, inline banner, tooltip). This is a design decision for `/ddd_des`.
- **Interaction with the existing "Content Page >>" button:** The button continues to operate independently — it shows the full filtered athlete list (not scoped to a city). These are two distinct entry points to the Content Page.
