# REQ: Map City Popup Redesign

## Summary

When a user hovers over a blue city dot on the US athlete map, a popup appears showing information about athletes from that city. The current popup shows only the city/state header and a plain list of athlete names. This feature redesigns that popup to show richer athlete cards — including a photo, full name, medal counts, and sport — while keeping the hover-to-show, cursor-following interaction behavior.

---

## Actors

- **Visitor** — any user viewing the athlete hometown map. No authentication is required.

---

## Primary Flow

1. Visitor moves the mouse over a blue city dot on the map.
2. A popup appears near the cursor (follows mouse movement, same as today).
3. The popup header displays the **city name only**.
4. Below the header, a scrollable list of athlete cards is shown — one card per athlete from that city.
5. Each athlete card contains:
   - **Photo**: the athlete's thumbnail image (sourced from `thumbnail_image_list[0].secure_url` in the athlete data).
   - **Full name**: first name + last name.
   - **Medal counts**: three colored indicators — gold, silver, bronze — each with its numeric count. All three are always shown (even if count is 0).
   - **Sport**: the title of the athlete's first sport (`sport[0].title`).
6. The visitor moves the mouse off the dot; the popup disappears.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | Hovering a blue city dot shows the popup; moving off hides it. |
| AC-2 | Popup header shows the city name only (no state abbreviation). |
| AC-3 | Each athlete in the city has exactly one card in the popup. |
| AC-4 | Each card shows a photo, first + last name, medal row (gold/silver/bronze with counts), and first sport title. |
| AC-5 | Medal row shows all three medal types with their counts; counts of 0 are displayed (not hidden). |
| AC-6 | When an athlete has no thumbnail image URL, a placeholder avatar is shown in the photo slot (consistent card layout maintained). |
| AC-7 | The popup has a maximum height (~300 px); the athlete list scrolls vertically if content exceeds that height. |
| AC-8 | The popup stays within the viewport; it does not overflow screen edges. |

---

## Edge Cases

| Scenario | Expected behavior |
|----------|-------------------|
| Athlete has no `thumbnail_image_list` entry | Show a placeholder avatar (silhouette or initials circle) |
| Athlete has multiple sports | Show only `sport[0].title`; remaining sports are not displayed |
| City has only one athlete | Popup renders a single card with no scroll |
| City has many athletes (e.g. 20+) | List scrolls; all athletes accessible via scroll |
| All athletes in a city have 0 medals | Medal row still renders "0" for gold, silver, bronze |

---

## Non-Functionals

- **Performance**: Athlete images are loaded from existing Cloudinary URLs; no additional API calls are introduced for the popup.
- **Responsiveness**: The popup is functional at typical desktop viewport widths used for the map (no explicit mobile breakpoint required; the map is not a mobile-first view).
- **Accessibility**: Not a primary requirement for this iteration; basic semantic markup (e.g. `alt` text on images) should still be included.

---

## Data & Integrations

- All athlete data (name, medals, sport, thumbnail URL) is already fetched server-side from `GET /athletes/hometowns` in `app/page.tsx`.
- The `thumbnail_image_list[0].secure_url` field must be propagated from the server component through the data pipeline to the `UsMap` component (it is currently omitted from the athlete shape passed down).
- Medal data (`gold`, `silver`, `bronze` integer counts) is already part of the data pipeline.
- Sport data is already present as a `sports: string[]` field; the popup uses `sports[0]` (the first sport title).

---

## Out of Scope

- Clicking on a city dot to navigate or open a detail page.
- Showing athlete biography, stats, or any other fields beyond photo, name, medals, and sport.
- Mobile / touch interaction redesign.
- Filtering or sorting athletes within the popup.
- Showing more than the first sport per athlete.
- State abbreviation in the popup header.
- Any change to the map interaction outside the popup (dot color, state highlight, etc.).

---

## Open Questions / Assumptions

- **Assumption**: `thumbnail_image_list` always contains at most one entry per athlete in the current dataset; the first entry's `secure_url` is used.
- **Assumption**: Medal counts are non-negative integers; no validation beyond truthy/falsy is required.
- **Open**: Exact placeholder avatar design (silhouette SVG, initials circle, gray box) is a design decision left to `/ddd_des`.
- **Open**: Precise popup offset from cursor (currently +12px, -36px) may be adjusted in design to avoid clipping near screen edges.
