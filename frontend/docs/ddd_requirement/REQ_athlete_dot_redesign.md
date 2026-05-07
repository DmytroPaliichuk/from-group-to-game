# REQ: Athlete Dot Redesign on US Map

## Summary

Replace the flat single-circle dots on the US athlete hometown map with a 3-layer glowing dot design. Each dot's size tier is determined by the number of athletes from that city. Athlete city dots use cyan; state city dots use red, with their size driven by how many filtered athletes come from each city (or Size 1 if none).

---

## Actors / Users

- **Map viewer** — anyone viewing the US athlete hometown map, interacting with dots and state filters.

---

## Background (Current State)

`UsMap.tsx` renders athlete city dots as flat SVG `<circle>` elements with:
- Default radius: 5px, fill `#38bdf8`, stroke `#0f172a`
- "Active" radius: 8px, fill `#f472b6` — **currently dead code** (no code sets the active state)

State city dots (shown when a state is zoomed in) are rendered as transparent circles with a red `#ef4444` stroke and radius 7px.

---

## New Dot Design

Each dot consists of three concentric SVG ellipses rendered as a `<g>` group:

| Layer | Description |
|-------|-------------|
| Glow  | Large outer ellipse, same color as the dot, opacity 0.3, with a Gaussian blur filter |
| Dot   | Solid filled ellipse centered in the glow, with an outer drop-shadow filter |
| Core  | Small white ellipse (#FFFFFF, opacity 0.9) centered inside the dot |

### Size Tiers (capped at Size 5+)

| Tier | Athletes | Glow (px) | Glow blur | Dot (px) | Dot shadow blur | Core (px) |
|------|----------|-----------|-----------|----------|-----------------|-----------|
| 1    | 1        | 18×18     | 6         | 8×8      | 5               | 3×3       |
| 2    | 2        | 24×24     | 8         | 10×10    | 6               | 4×4       |
| 3    | 3        | 30×30     | 10        | 12×12    | 7               | 5×5       |
| 4    | 4        | 36×36     | 12        | 14×14    | 8               | 6×6       |
| 5+   | ≥ 5      | 42×42     | 14        | 16×16    | 9               | 7×7       |

Dot-shadow spread is 1px for all tiers.

### Color Schemes

| Dot type         | Glow fill | Dot fill  | Shadow color | Core fill |
|------------------|-----------|-----------|--------------|-----------|
| Athlete (cyan)   | `#06B6D4` | `#06B6D4` | `#06B6D4`    | `#FFFFFF` |
| State city (red) | `#EF4444` | `#EF4444` | `#EF4444`    | `#FFFFFF` |

---

## Functional Requirements

### FR-1 — Athlete city dots
All athlete city dots displayed on the map shall use the 3-layer glowing design (glow + dot + core) in the cyan color scheme.

### FR-2 — Size tier by athlete count
The size tier for each city dot is determined by the number of athletes **currently visible** (after game/season/medal filters are applied). Cities with 5 or more athletes all use Size 5+.

### FR-3 — State city dots
When a state is selected, the top-5 state city markers shall also use the 3-layer glowing design in the red color scheme.

### FR-4 — State city dot sizing
The size tier of a state city dot is determined by cross-referencing the city name against the currently filtered athlete dataset for that state:
- If N athletes match the city → use Size tier N (capped at 5+)
- If no athletes match → use Size 1 (smallest)

### FR-5 — Size cap
No dot shall exceed Size 5+ regardless of athlete count.

### FR-6 — Hover behavior (unchanged)
Hover behavior remains identical to the current implementation:
- `mousemove` on a dot → show tooltip with city name, state, and athlete list
- `mouseenter` on a dot → highlight the corresponding state border in yellow (`#facc15`)
- `mouseleave` → hide tooltip, remove state border highlight

No visual change to the dot itself on hover.

### FR-7 — City labels for state cities
When a state is selected, city name labels below state city markers shall remain visible and styled as before (fill `#f1f5f9`, font size 12, centered, 18px below center).

---

## Acceptance Criteria

1. **Visible:** On page load, each city dot on the map is visually distinguishable as a glowing layered dot, not a flat circle.
2. **Size reflects count:** A city with 1 athlete has a visibly smaller dot than a city with 5+ athletes.
3. **Cyan dots:** Athlete city dots are cyan (`#06B6D4`) with a glow halo.
4. **Red state dots:** After selecting a state, the top-5 city markers appear as red (`#EF4444`) layered dots sized by athlete count.
5. **Tooltip works:** Hovering an athlete dot still shows the city + athlete list tooltip.
6. **State highlight works:** Hovering a dot still highlights the corresponding state border.
7. **Build passes:** `npm run build` produces no TypeScript or compilation errors.

---

## Edge Cases

- **City has 0 visible athletes after filtering:** Such cities are already removed before rendering (filtered out in `MapWithFilter.tsx`). No dot is drawn.
- **State city not in athlete data:** Displays as Size 1 red dot.
- **Projection returns null for a city:** Dot is skipped (existing guard `.filter(d => projection([d.lng, d.lat]) !== null)` retained).

---

## Out of Scope

- Redesigning the tooltip UI.
- Redesigning the hover interaction (size/color change on hover).
- Adding a map legend to the UI (the design legend is a reference artifact only).
- Changes to the `MapWithFilter` filter controls.
- Changes to the `Chat` sidebar or `ContentPage` components.
- Animation or transition effects on dot appearance.
- Responsive/mobile-specific dot sizing.

---

## Assumptions

- SVG blur and drop-shadow effects are implemented using inline `<defs><filter>` elements in the D3-rendered SVG. CSS `filter` is not used on SVG elements to keep the rendering self-contained and cross-browser consistent.
- The dot glow, dot body, and core are all drawn as `<ellipse>` elements inside a `<g>` group per city, centered at the projected map coordinate.
- The D3 `useEffect` is the only place dot rendering happens; no additional React state management is required.
