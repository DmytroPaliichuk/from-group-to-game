# REQ: Show Athlete Photo in City Popup

## Summary

When a user hovers over a blue dot on the US map, a popup lists athletes from that city. Each athlete row has a circular avatar slot that currently shows initials (e.g. "KB") because the backend API does not return photo URLs. This feature makes the popup show the actual athlete photo sourced from `thumbnail_image_list[0].secure_url`.

---

## Actors

- **End user** — views the interactive map and hovers over city dots.

---

## Current State

- The popup (`CityTooltip`) renders a 40×40 circular avatar per athlete.
- The avatar falls back to an initials circle because `thumbnail` is always an empty string.
- Root cause: `GET /athletes/hometowns` does not include `thumbnail_image_list` in its response payload (`backend/main.py` lines 86–94).
- The frontend (`app/page.tsx` line 23) already maps `a.thumbnail_image_list?.[0]?.secure_url ?? ''` to the `thumbnail` field — the mapping is correct but the data is missing.

---

## Primary Flow

1. User hovers over a blue city dot.
2. Popup appears listing athletes from that city.
3. Each athlete row shows a real photo pulled from `thumbnail_image_list[0].secure_url`.

---

## Acceptance Criteria

1. The `GET /athletes/hometowns` response includes a `thumbnail_image_list` field per athlete entry, containing at minimum the first `secure_url` string (or an empty list when none exists).
2. Athletes with a valid thumbnail URL show their photo in the popup avatar slot (40×40 circle, `object-cover`).
3. Athletes with no `thumbnail_image_list` entry (empty array or missing field) show the initials fallback circle — no blank or broken element.
4. If a thumbnail URL is present but the image fails to load (network error, 404, etc.), the avatar falls back to the initials circle automatically — no broken-image browser icon is shown.

---

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| `thumbnail_image_list` is an empty array | Show initials fallback |
| `thumbnail_image_list[0].secure_url` is `null` or empty string | Show initials fallback |
| Image URL is valid but request returns 4xx/5xx | Fall back to initials on `onError` |
| Athlete first or last name is a single character | Initials fallback still renders (uses first char of each name) |

---

## Non-Functionals

- **Performance:** The popup is rendered on hover; image loading should not block the popup appearing. Images load naturally via the browser — no prefetch required.
- **Privacy / Security:** Image URLs originate from the Cloudinary CDN already embedded in the JSON data file; no new external domains are introduced.

---

## Integrations & Data

- **Source:** `backend/data/athletes_1.json` → field `thumbnail_image_list[].secure_url` (Cloudinary CDN URLs).
- **API change:** `GET /athletes/hometowns` (Python/FastAPI, `backend/main.py`) must include the first `secure_url` from `thumbnail_image_list` per athlete in its response.
- **Frontend mapping:** `app/page.tsx` already extracts `thumbnail_image_list?.[0]?.secure_url` — no change needed there.
- **Display:** `components/CityTooltip.tsx` `Avatar` component — needs an `onError` handler added to the `<img>` tag to trigger the initials fallback when the image fails to load.

---

## Out of Scope

- Showing multiple photos per athlete.
- Using `hero_image`, `featured_image_list`, or `bio.image` as the photo source.
- Lazy-loading, blur placeholders, or skeleton loaders.
- Clicking an avatar to open an athlete profile page.
- Any change to avatar size or shape beyond what already exists (40×40 circle).
- i18n / accessibility changes beyond what `alt` text already provides.

---

## Open Questions / Assumptions

- **Assumption:** All `thumbnail_image_list[].secure_url` values are publicly accessible Cloudinary URLs that the browser can load without authentication. If any are behind auth, a fallback to initials will naturally trigger via `onError`.
- **Assumption:** The Next.js app does not need the `next/image` domain allowlist updated because the `<img>` element (not `next/image`) is used in the Avatar component. If Next.js is later configured to use `next/image`, the Cloudinary domain (`res.cloudinary.com`) must be added to `next.config`.
