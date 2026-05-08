# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Development Commands

- Never run `npm run dev`
- Use `npm run build` to check if code compiles or not. See results and fix code if needed
- `npm run lint` - Run ESLint for code quality

## Environment

Requires `.env.local` with:
```
API_URL=http://localhost:8000
```

## Architecture

This is a US athlete hometown map visualization app. The server fetches athlete data and renders an interactive D3 map with a chat sidebar.

**Data flow:**
```
app/page.tsx (Server Component)
  → fetch ${API_URL}/athletes/hometowns
  → transform to {city, state, lat, lng}[]
  → ResizableLayout → MapContentSlider → MapWithFilter → UsMap (D3)
```

**Component roles:**
- `app/page.tsx` — only server component; owns the API fetch
- `ResizableLayout` — drag-to-resize split between map and chat (200–700px)
- `MapContentSlider` — two-page slider (Map / Content) via CSS `translateX`
- `MapWithFilter` — wraps UsMap with a state dropdown filter
- `UsMap` — D3/TopoJSON SVG map; fetches US topology from CDN, renders city dots
- `Chat` — placeholder sidebar; AI integration is not yet implemented
- `ContentPage` — stub page, not yet implemented

**Static data:** `/public/topStateSities.json` — top 5 cities per state with coordinates, used by UsMap when a state is selected.

## Key conventions

- All interactive components require `'use client'`; keep server components at the page level only.
- State is local (`useState`/`useRef`/`useEffect`) — no global state library.
- Styling uses Tailwind CSS v4 (PostCSS) with a dark slate theme.
- Path alias `@/*` resolves to the repo root.
- TypeScript strict mode is on.
- Use context7 tool to see libraries documentations.
