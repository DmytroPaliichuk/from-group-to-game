# REQ: Structured Agent Response — Backend & Frontend Integration

## Overview

The US Olympics agent (`agent/us_olympics_agent/agent.py`) already emits structured output via `output_schema=AgentResponse`. The `AgentResponse` Pydantic model has three fields: `text` (chat reply), `filters` (map filter state), and `followups` (suggested next questions). Neither the backend nor the frontend currently handles these fields — the backend concatenates all text parts into a plain string, and the frontend renders it without map interaction.

This requirement covers the changes needed so that the structured response flows end-to-end: backend parses and forwards all three fields; frontend applies filters to the map and shows follow-up question buttons.

---

## Actors

- **End user** — interacts with the chat panel and the map
- **AI agent** — returns structured `AgentResponse` JSON via Vertex AI Agent Engine

---

## AgentResponse Schema (reference, not implementation)

```
text:     string       — prose answer for the chat bubble
filters:  dict         — map filter keys → list of values
                         keys: state, game, season, medal, sport, athlete, city
                         {} means "no filter opinion this turn"
followups: list[str]  — 2–4 suggested next questions
```

---

## Primary Flows

### 1. Happy path — structured response

1. User sends a message in the chat panel.
2. Backend receives the request, forwards it to the Vertex AI Agent Engine.
3. Agent Engine returns streaming events; the backend collects all text parts and attempts to parse the result as `AgentResponse` JSON.
4. On success, the backend returns:
   ```json
   {
     "reply":     "<text field>",
     "filters":   { ... },
     "followups": ["...", "..."]
   }
   ```
5. Frontend receives the response:
   - Renders `reply` as a markdown assistant message (existing behavior).
   - If `filters` is non-empty, replaces all current map filter state with the agent-supplied filters.
   - Displays each item in `followups` as a clickable button below the assistant message.
6. Clicking a follow-up button sends that text as a new user message (same as typing it).

### 2. Empty filters — general / non-geographic question

1. Agent returns `filters: {}`.
2. Backend forwards `filters: {}` to frontend unchanged.
3. Frontend detects empty filters and leaves the current map filter state untouched — no reset, no change.

### 3. Agent reset instruction

The agent already has a documented reset payload (all filter dimensions set to their full value lists). This flows through the same happy path: the frontend receives non-empty filters and replaces all filter state with the reset values.

### 4. Graceful degradation — unparseable agent response

1. Backend fails to parse the agent's collected text as `AgentResponse` JSON.
2. Backend returns:
   ```json
   {
     "reply":     "<raw text>",
     "filters":   {},
     "followups": []
   }
   ```
3. Frontend renders the reply as plain text; no map update; no follow-up buttons.
4. No error message is shown to the user.

### 5. Existing error paths (unchanged)

- 4xx from backend → session expired → new session created, messages cleared (existing behavior)
- 5xx / network error → generic error message in chat (existing behavior)

---

## Acceptance Criteria

### Backend

- `POST /agent/chat` response shape changes from `{ "reply": string }` to `{ "reply": string, "filters": object, "followups": array }`.
- When the collected agent text is valid `AgentResponse` JSON, `reply` is set to `text`, `filters` and `followups` are forwarded as-is.
- When parsing fails for any reason, `reply` is the raw collected text, `filters` is `{}`, `followups` is `[]`. No 5xx is raised for parse failures.
- Existing session and error behavior is unchanged.

### Frontend — filters

- When `filters` is non-empty, all map filter dimensions (game, season, medal, state, sport, athlete, city) are replaced with the agent-supplied values.
- When `filters` is `{}`, the map filter state is not modified.
- The replacement happens immediately when the response is received (no extra user confirmation).
- The existing map filter dropdowns reflect the updated state after replacement.

### Frontend — follow-up buttons

- Each string in `followups` is rendered as a distinct clickable button directly below the assistant message bubble.
- Clicking a button populates and sends that text as a new user message — identical to the user typing it manually.
- Follow-up buttons are ephemeral: they are not persisted to localStorage. On page reload, the message history is restored but no follow-up buttons appear.
- If `followups` is empty, no buttons are rendered.

### Frontend — backward compatibility

- If the backend ever returns only `{ "reply": string }` (old shape), the frontend treats it as no filter update and no follow-ups (does not crash).

---

## Errors & Edge Cases

| Scenario | Expected behavior |
|---|---|
| Agent returns `filters: {}` | Map unchanged |
| Agent returns `filters` with unknown keys | Frontend ignores unknown keys; known keys applied |
| `followups` list is empty | No buttons rendered |
| Parse failure in backend | Graceful degradation; raw text shown |
| User clicks follow-up while a message is loading | Button is disabled / ignored (same rule as the send button) |
| Page reload mid-conversation | Messages restored, follow-up buttons NOT restored |

---

## Non-Functionals

- **Latency:** Structured output parsing on the backend is in-process; no additional network call. No latency regression.
- **Backward compat:** Existing session management, localStorage keys, and error-handling flows are unchanged. The only schema change is additive (`filters` and `followups` fields added to the chat response).

---

## Out of Scope

- Displaying the raw filter values in the chat bubble (e.g. "I applied filters: state=TX, medal=Gold").
- Animating the map to highlight newly filtered athletes.
- Persisting follow-up buttons across page reloads.
- Any changes to the session creation endpoint or athlete hometowns endpoint.
- Changes to how the agent itself generates `filters` or `followups` (already implemented in `agent.py`).
- Streaming the agent response to the frontend (backend still buffers the full response before returning).

---

## Open Questions / Assumptions

- **Assumption:** The Vertex AI Agent Engine, when `output_schema` is set, encodes the `AgentResponse` as a JSON string inside `event.content.parts[].text`. Verification of the exact wire format will be needed when implementing the backend parser.
- **Open:** The `MapWithFilter` component exposes filter state via props or callbacks from a parent (`ResizableLayout` or `page.tsx`). The exact wiring for the frontend to push agent-supplied filters into `MapWithFilter` state needs to be confirmed during design — this is an architectural question deferred to `/ddd_des`.
