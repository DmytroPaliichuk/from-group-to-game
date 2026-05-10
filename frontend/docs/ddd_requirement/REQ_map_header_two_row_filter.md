# REQ: Map Header Two-Row Filter Redesign

## Overview

The map page header currently displays all filter controls in a single horizontal row. This redesign splits the header into two distinct rows separated by a thin divider, grouping primary filters on top and search inputs on the bottom. The total header height will grow naturally to accommodate both rows without compressing any controls.

---

## Actors

- **End user** — visits the map page, applies filters, and navigates to the content page.

---

## Current State

A single-row filter bar (~52px tall) in `MapWithFilter` containing all controls left-to-right:

```
Game | Season | Medal | Sport | [Athlete Search] [City Search] [Content Page]
```

---

## Target State

Two stacked rows with a thin horizontal divider between them:

```
┌─────────────────────────────────────────────────────────────┐
│  Game  Season  Medal  Sport                     [Content]   │  ← Row 1
├─────────────────────────────────────────────────────────────┤
│  [Athlete Search ..................] [City Search ..........]│  ← Row 2
└─────────────────────────────────────────────────────────────┘
```

---

## Row Definitions

### Row 1 — Primary Filters

Contains, in left-to-right order:
1. **Game** toggle (Olympian / Paralympian image buttons)
2. **Season** toggle (Summer / Winter image buttons)
3. **Medal** toggles (gold, silver, bronze, no-medal)
4. **Sport** dropdown (multi-select panel)
5. **Content Page** button — **right-aligned**, pushed to the far right end of the row

### Row 2 — Search Inputs

Contains, side by side at equal width (each 50% of the row):
1. **Athlete Search** — left half
2. **City Search** — right half

---

## Visual Design

- **Divider**: A thin horizontal rule between Row 1 and Row 2, matching the existing dark slate theme.
- **Background**: Both rows share the same dark header background (no different shades per row).
- **Height**: The header grows to fit both rows at their natural control sizes (~52px × 2). The map viewport will shrink accordingly.
- **Spacing / padding**: Match existing internal padding of the current single-row header.

---

## Acceptance Criteria

1. Row 1 is rendered above Row 2 with a visible thin divider between them.
2. Game, Season, Medal, and Sport controls appear in Row 1, left-aligned, with the same appearance and behavior as today.
3. The Content Page button appears in Row 1, right-aligned (flex end), and navigates to the content view as today.
4. Athlete Search and City Search appear in Row 2, side by side, each occupying exactly half the available width.
5. All filter state and search state behave identically to the current implementation — only layout changes.
6. The header height expands to naturally accommodate both rows; no control is visually compressed.
7. The map viewport adjusts to the taller header without overlap or clipping.

---

## Out of Scope

- Changes to the internal behavior or logic of any filter (Game, Season, Medal, Sport, Athlete Search, City Search).
- Changes to the Content Page itself.
- Responsive / mobile breakpoint handling (desktop-only redesign).
- Adding new filter controls.
- Changing the visual style of individual controls (colors, fonts, button shapes).
