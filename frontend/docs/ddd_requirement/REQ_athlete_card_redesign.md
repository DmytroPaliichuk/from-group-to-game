# REQ: Athlete Card Redesign

**Status:** Locked  
**Created:** 2026-05-09  
**Feature:** Redesign the athlete card in the Content page to display richer athlete information

---

## 1. Background

The athlete Content page currently shows a compact grid of athlete cards (`AthleteCard.tsx`) with limited information: photo/initials, name, city, sport(s), and medal counts. The goal is to redesign the card to display a complete athlete profile in the layout sketched in the wireframe — photo beside name/hometown/birthday/education/sport, followed by medals, fun fact, and biography.

---

## 2. Actors

- **General public / site visitor** — the only actor. Reads athlete profiles on the Content page. No login or personalization is involved.

---

## 3. Primary Flow

1. User navigates to the Content page (the "Content" tab/slider in the app).
2. The page renders a **2-column grid** of redesigned athlete cards.
3. Each card displays the athlete's full profile inline.
4. The biography is **collapsed by default**; the user clicks "Read more" to expand it in place.
5. Collapsing/expanding is per-card and independent across cards.

---

## 4. Card Layout and Content

### 4.1 Top section (photo + identity)

A horizontal split within the card:

- **Left:** Athlete photo.  
  - If the photo fails to load or is absent, show the athlete's initials (first letter of first name + first letter of last name, uppercased) on a dark placeholder background.
- **Right (stacked vertically):**
  1. **Full name** — `first_name` + `last_name`
  2. **Hometown** — `city`, `state` (e.g. "Lake Stevens, WA")
  3. **Birthday** — formatted as "Month Day, Year" (e.g. "June 8, 1986"). Hidden if null/absent.
  4. **Education** — e.g. "Oklahoma State". Hidden if null/absent.
  5. **Sport(s)** — title only for each sport, all sports listed (e.g. "Sitting Volleyball" or "Soccer, Basketball"). Hidden if absent.

### 4.2 Bottom section (achievements + narrative)

Stacked below the top section:

1. **Medals** — displayed as emoji icon + count for each medal type that has count > 0.  
   - Gold: 🥇, Silver: 🥈, Bronze: 🥉  
   - Medals with a count of 0 are hidden.  
   - Hidden entirely if athlete has no medals.
2. **Fun fact** — shown only if the `fun_fact` field is non-null and non-empty.
3. **Biography** — rendered as formatted HTML (the source data contains headings, bullet lists, and paragraphs).  
   - **Collapsed by default**, showing only the first ~3 lines.  
   - A **"Read more"** button/toggle expands the full biography in place.  
   - A **"Show less"** toggle collapses it again.  
   - Hidden if null/absent.

---

## 5. Visual Style

- Dark slate theme, consistent with the rest of the application.
- Card background: dark slate (current `#1e293b` / slate-800).
- Primary text: near-white (slate-100).
- Secondary text (hometown, birthday, education, sport): muted (slate-300/400).
- Card border: slate-700.
- Corner radius and padding consistent with the existing dark-themed components.

---

## 6. Grid Layout

- **2 columns** at all viewport sizes supported by the Content page.
- The ContentPage scroll area handles overflow as cards grow tall.

---

## 7. Data Requirements

### 7.1 New fields needed on the frontend athlete type

The `FlatAthlete` type (currently in `MapWithFilter.tsx`) must be extended to include:

| Field        | Source in raw data              | Nullable |
|--------------|---------------------------------|----------|
| `state`      | `bio.hometown.state`            | No       |
| `birthday`   | `bio.birthday`                  | Yes      |
| `education`  | `bio.education`                 | Yes      |
| `fun_fact`   | `bio.fun_fact`                  | Yes      |
| `biography`  | `bio.biography`                 | Yes      |
| `sport_titles` | `sport[].title` (all items)   | No (array may be empty) |

### 7.2 Backend scope

The `/athletes/hometowns` API endpoint **does not currently return** `birthday`, `education`, `fun_fact`, or `biography`. The backend must be updated to include these fields in its response before the frontend can consume them. This is in scope for this effort.

---

## 8. Acceptance Criteria

- [ ] The Content page grid renders in **2 columns**.
- [ ] Each card shows: photo (or initials fallback), full name, city + state, birthday (if present), education (if present), all sport titles (if present), medals (non-zero only), fun fact (if present), biography (if present).
- [ ] Biography HTML is rendered with formatting (headings, lists) and is collapsed by default.
- [ ] "Read more" expands the biography; "Show less" collapses it again.
- [ ] Cards with all optional fields absent still render correctly with only required fields.
- [ ] Photo load errors fall back to initials without a broken image icon.
- [ ] The dark slate visual theme is applied consistently.
- [ ] The biography HTML is sanitized before rendering to prevent XSS.

---

## 9. Error and Edge Cases

| Scenario | Expected behavior |
|----------|-------------------|
| Photo URL fails to load | Show initials placeholder |
| `fun_fact` is null | Section is not rendered |
| `biography` is null or empty | Biography section is not rendered |
| `birthday` is null | Birthday row is not rendered |
| `education` is null or empty | Education row is not rendered |
| Athlete has 0 medals | Medal section is not rendered |
| `sport` array is empty | Sport row is not rendered |
| Biography HTML contains scripts/XSS | Sanitized before render; scripts stripped |

---

## 10. Non-Functional Requirements

- **Security:** Biography is raw HTML from the backend. It must be sanitized (e.g. strip `<script>`, event handlers) before being injected into the DOM.
- **Performance:** No specific latency targets; biography HTML may be large but is already downloaded with the page data.
- **Accessibility:** Not specifically in scope, but existing keyboard navigation and screen-reader behavior should not regress.
- **i18n:** Not in scope. All data is English; no multi-language support required.

---

## 11. Out of Scope

- **Clicking a card to open a modal/detail view** — the card is the complete view; no click-to-expand interaction beyond "Read more" for biography.
- **Filtering or sorting athletes** on the Content page — existing filter behavior is unchanged.
- **Map popup / CityTooltip** — the `CityTooltip` component shown on hover over map dots is a separate component and is not redesigned in this effort.
- **Light/wireframe color theme** — the wireframe's light blue card style is not being adopted; dark slate is kept.
- **Admin / editing** — no write operations; read-only display only.
- **Pagination** — Content page remains a scrollable list of all filtered athletes.

---

## 12. Open Questions / Assumptions

- **Assumption:** The backend will be updated to return `birthday`, `education`, `fun_fact`, and `biography` as part of the same development effort. Frontend work may proceed in parallel but will require the backend change before end-to-end testing.
- **Assumption:** The biography sanitization library choice is a design/implementation decision, not locked here.
- **Open question:** If the backend cannot include biography in the `/athletes/hometowns` bulk response (e.g. due to payload size), a per-athlete detail endpoint may be needed — to be evaluated during design.
