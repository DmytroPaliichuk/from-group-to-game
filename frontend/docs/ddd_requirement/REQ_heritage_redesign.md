# REQ: Heritage UI Redesign

**Date:** 2026-05-11  
**Author:** DmytroPaliichuk  
**Status:** Locked  

---

## Overview

Replace the current dark purple/slate visual theme with the "Heritage" light design system. The app's functionality — map rendering, filters, chat AI, content page, state zoom, city search, and athlete search — remains unchanged. Only the visual design changes.

The Heritage design is warm and minimal: off-white canvas, white cards with large rounded corners, a structured top toolbar, a right-side chat panel, and a lime-green accent color.

---

## Actors

- **End user (desktop):** Views the map, applies filters, searches athletes/cities, reads athlete profiles, and converses with the AI chat. The app targets 1440px-wide desktops.

---

## Visual Design System

### Color tokens

| Token | Value | Usage |
|---|---|---|
| Canvas | `#fafaf7` | Page background |
| Surface | `#ffffff` | Cards, toolbar, search row, chat panel |
| Ink primary | `#0e0f0c` | Body text, icons |
| Ink secondary | `#454745` | Secondary text |
| Ink tertiary | `#868685` | Muted text, placeholders |
| Green accent | `#9fe870` | Active state, send button, "+New" button bg, filter active border |
| Dark green | `#163300` | Text on green backgrounds |
| Mint | `#e2f6d5` | Badge backgrounds, active filter backgrounds, hover fills |
| Border subtle | `rgba(14,15,12,0.10)` | Card borders, dividers, input borders |
| Medal gold | `#FFD166` | Gold medal pip |
| Medal silver | `#D9DFE4` | Silver medal pip |
| Medal bronze | `#D78F5E` | Bronze medal pip |

### Typography

- **Display (logo, city name in popup, modal title):** Archivo Black — load via Google Fonts
- **Body:** Inter (already loaded)
- Body base size: 18px, weight 600, line-height 1.44

### Spacing & shape

- Card border-radius: 30px (map card, chat panel)
- Pill border-radius: 9999px (buttons, badges, medal pips)
- Cards use a ring shadow: `rgba(14,15,12,0.12) 0 0 0 1px`

---

## Primary Flows

### 1. Default map view

**Layout:**
```
┌─────────────────────────── Top Bar (white, 72px) ───────────────────────────────┐
│ ● OlymPick  |  GAME [⚡][♿]  SEASON [☀][❄]  MEDALS [●][●][●][Ø]  SPORT [All▼] │
│                                                      [Clear filters]  [Content→] │
└─────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────── Search Row (white, below top bar) ──────────────────────────┐
│  ATHLETE [search athletes…]              CITY [search cities…]                   │
└─────────────────────────────────────────────────────────────────────────────────┘
┌─── Map card (flex-1) ────────────────┐  ┌── Chat panel (resizable, default 460) ┐
│  White card, radius 30, border       │  │  White card, radius 30, 24px margins  │
│  D3 US map; state fill #eef2ec;      │  │  Header: ✨ Ask OlymPick              │
│  dots in #0e0f0c; hover highlights   │  │  Online · 128 yrs of data   [+ New]   │
│                                      │  │  ─────────────────────────────────    │
│                                      │  │  Chat messages                         │
│                                      │  │  ─────────────────────────────────    │
│                                      │  │  [Composer ─────────────── 🎤 →]      │
└──────────────────────────────────────┘  └────────────────────────────────────────┘
```

**Acceptance criteria:**
- Page background is `#fafaf7`
- Top bar is white, 72px tall, with a `1px solid rgba(14,15,12,0.10)` bottom border
- Map fills a white card (radius 30, ring shadow) with 24px padding from the main area edges
- Chat panel is a white rounded card with 24px margin from all edges on its side, 30px radius
- Resizable drag handle between map and chat (320–720px range), same as current behavior

---

### 2. Top Bar — filter groups

Four filter groups, left of the separator; two action buttons on the right.

**Game** (label: "GAME", uppercase kicker in `#868685`):
- Two circular icon buttons (38px, rounded pill)
  - Olympic: lightning bolt icon (`zap`)
  - Paralympic: accessibility icon (`accessibility`)
- Active state: mint background (`#e2f6d5`), `1.5px` dark-green border
- Inactive state: white background, subtle border

**Season** (label: "SEASON"):
- Two circular icon buttons (same spec)
  - Summer: sun icon
  - Winter: snowflake icon

**Medals** (label: "MEDALS"):
- Four circular pip buttons (32px):
  - Gold pip: `#FFD166`
  - Silver pip: `#D9DFE4`
  - Bronze pip: `#D78F5E`
  - No-medal pip: white background, `Ø` symbol in tertiary ink
- Active state: `2px` dark-green border

**Sport** (label: "SPORT"):
- A pill-shaped button "All disciplines ▼" that opens the Sport Disciplines Modal (see §5)
- Shows count of selected disciplines when any are active (e.g. "4 sports ▼")

**Right actions:**
- "Clear filters" — ghost text button; resets all filters to defaults
- "Content page →" / "← Map page" — green pill button (`#9fe870`, dark-green text) that toggles between Map and Content views; label and direction arrow change based on active view

**Acceptance criteria:**
- Toggling a filter button updates the app filter state immediately (same wiring as today)
- Active filters are visually distinct from inactive ones per the styles above

---

### 3. Search row

Below the top bar, a white row with a bottom border.

- Two labeled search inputs side-by-side:
  - **Athlete** label (uppercase, 10px, tertiary ink) + input placeholder "Search athletes…"
  - **City** label + input placeholder "Search cities…"
- Both inputs are pill-less, subtle border (`rgba(14,15,12,0.10)`), radius 10px
- Searching wires to the existing athlete/city search functionality

**Acceptance criteria:**
- Search inputs clear when "Clear filters" is pressed (existing `searchClearSignal` mechanism)

---

### 4. Hometown popup (hover)

When the user hovers over a map dot, a popup card appears near the dot.

**Card spec:**
- White card, radius 20px
- Ring shadow: `rgba(14,15,12,0.20) 0 0 0 1px` + `rgba(14,15,12,0.10) 0 12px 32px`
- Width: 280px

**Content:**
- City name in Archivo Black, 22px
- Subtitle: "{State} · {N} athletes" in tertiary ink, 11px
- "HOMETOWN" badge: mint background, dark-green text, uppercase, pill
- Athlete rows (one per athlete in city):
  - Avatar (40px circle): real thumbnail image if available, else initials-gradient fallback
  - Name (13px, weight 700)
  - Sport (11px, weight 500, secondary ink)
  - Medal chips (gold/silver/bronze pill badges with counts)
  - Rows separated by a subtle 1px border except the first

**Acceptance criteria:**
- Popup matches the Heritage spec above
- Popup disappears on mouse-out (existing behavior preserved)

---

### 5. Sport Disciplines Modal

Opened by clicking the "All disciplines ▼" sport filter button.

**Overlay:** Semi-transparent dark backdrop (`rgba(14,15,12,0.40)`) covering the full page

**Modal card (width 880px, max-height 85vh):**
- White card, radius 30px, strong shadow
- Header: title "Pick your sports." (Archivo Black 28px) + subtitle "{N} selected · {total} total disciplines", close (×) button
- Search row: Athlete + City search inputs (same style as §3)
- Scroll area with two sections:
  - **SUMMER** (☀ icon, amber color) — list of summer disciplines with 3-column layout
  - **WINTER** (❄ icon, blue color) — list of winter disciplines
  - Each discipline is a checkbox row: green checkbox if selected, subtle border if not
- Footer: "Clear all" ghost button | "Cancel" outline pill | "Apply {N} filters" green pill button

**Acceptance criteria:**
- Selecting/deselecting sports updates the app's `sportFilter` state
- Modal closes on Cancel, Apply, × button, or clicking the backdrop
- "Apply N filters" count reflects current selection count

---

### 6. Content page — Athlete profiles

Activated by clicking "Content page →". The top bar shows "← Map page" instead.

**Layout:**
- Same top bar and search row
- Main area: 2-column grid of athlete cards, no chat panel (chat panel hidden on content page per current behavior — or follows same resizable behavior if currently shown)
- Cards are scrollable

**Athlete card spec:**
- White card, radius 20px, ring shadow
- Avatar: 120px wide, 16px radius (rounded rectangle)
  - Real thumbnail image from API if available
  - Else: initials-gradient avatar (same hue algorithm as design)
- Name (Inter, 800 weight, 19px)
- City (13px, weight 600, secondary ink)
- Sport badge: mint pill, dark-green text, uppercase 10px
- Birth year: "Born {year}" in tertiary ink, 11px
- Medal chips (gold/silver/bronze) top-right of card
- "Read more ▼" / "Show less ▲" toggle (dark-green text, no border)
  - Expanded state shows quick facts bullet list

**Acceptance criteria:**
- Cards render with real athlete data from the API
- Real thumbnail shown when available, initials avatar as fallback
- Read more/less toggle works per card independently

---

### 7. Chat panel — Heritage styling

The existing AI chat functionality is preserved. Visual changes only:

- **Panel container:** White card, 30px radius, 24px margin from page edges on its side
- **Header:**
  - Green circle (28px) with sparkles icon (dark-green)
  - "Ask OlymPick" title (14px, weight 700)
  - Subtitle: "Online · 128 yrs of data" (11px, tertiary ink)
  - "+ New" pill button: mint background, dark-green text, 11px
- **Chat bubbles:**
  - User messages: near-black background (`#0e0f0c`), off-white text, `20px 20px 4px 20px` radius
  - AI messages: white background, ring shadow, `4px 20px 20px 20px` radius
- **Follow-up chips:** mint background, dark-green text, pill shape
- **Composer:** pill-shaped container (ring shadow), text input + mic icon + green send button (arrow-right icon)
- **Drag handle:** 4px wide × 56px tall rounded bar in subtle border color between map and chat

**Acceptance criteria:**
- All existing chat functionality (AI responses, filter application, follow-up chips) works as before
- "+ New" button clears/resets the chat conversation if wired, or is a visual stub if not yet implemented

---

### 8. Map visual updates

- State fill color: `#eef2ec` (light mint-gray, vs. current colored fills)
- Map dots: `#0e0f0c` (near-black, vs. current blue)
- Dot hover/highlight remains functional
- State border color updates to match Heritage palette

---

## Non-Functionals

- **Desktop only:** Target 1440px wide. No mobile/responsive work in scope.
- **Build must pass:** `npm run build` must succeed with no TypeScript errors.
- **No global state:** Existing `useState`/`useRef`/`useEffect` pattern is preserved.
- **Font loading:** Archivo Black via Google Fonts `<link>` in `app/layout.tsx`.
- **Icon library:** `lucide-react` package for Game/Season icons, sparkles, mic, arrow-right, chevrons, etc.

---

## Out of Scope

- **Dark mode / theme toggle:** No dark mode; Heritage is light-only.
- **Mobile / responsive layout:** Desktop 1440px only.
- **New AI features:** Chat functionality is unchanged — only visual reskin.
- **Animation / transitions:** No motion design beyond existing hover states.
- **Direction B ("Marquee"):** Only Heritage (Direction A) is implemented.
- **Tweaks panel:** The interactive tweaks panel from the prototype is not built; a fixed "comfy" density and right-side chat are used.
- **Data changes:** No changes to the API or data fetching logic.

---

## Open Questions / Assumptions

- **Chat "+ New" button:** Assumed to be a visual stub (no backend "new conversation" endpoint confirmed). Implement as a button with no-op or clear-messages behavior matching whatever is already wired.
- **Lucide icon package:** `lucide-react` will be installed. If blocked, Heroicons or a CDN fallback can substitute.
- **Sport list:** The summer/winter discipline lists from the design prototype will be used verbatim as the sport filter options (matches existing `sportFilter` state).
