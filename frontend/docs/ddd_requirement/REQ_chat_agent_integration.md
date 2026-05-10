# REQ: Chat Agent Integration

## Overview

Wire the existing `Chat` component to the backend AI agent. This covers three
tightly-coupled concerns:

1. **Persistent user identity** — generate a `user_id` on first visit and keep
   it in `localStorage` so every API call is tied to the same user across
   sessions and reloads.
2. **Session lifecycle** — create and persist a backend session (`session_id`)
   that scopes the agent conversation; expose a "New Session" button so the
   user can explicitly reset context.
3. **Real chat** — replace the placeholder echo with actual calls to
   `POST /agent/chat`, with loading feedback and error recovery.

---

## Actors

| Actor | Description |
|---|---|
| **Visitor** | Any browser user who opens the app page. |
| **Backend agent** | The FastAPI service at `API_URL`; endpoints `/agent/sessions` and `/agent/chat`. |

---

## Functional Requirements

### 1. Persistent User Identity

**FR-1.1** On first visit the browser generates a unique `user_id` (a UUID v4
is sufficient) and writes it to `localStorage` under a fixed key (e.g.
`"user_id"`).

**FR-1.2** On every subsequent visit the existing `user_id` is read from
`localStorage` and reused. A new one is **never** generated as long as a valid
value exists.

**FR-1.3** The `user_id` is passed to every `/agent/sessions` and `/agent/chat`
call.

---

### 2. Session Lifecycle

**FR-2.1** On component mount the Chat component checks `localStorage` for a
stored `session_id`.

- If one is found, it is used immediately (no network call on mount).
- If none is found, the component calls `POST /agent/sessions` with the
  current `user_id`, stores the returned `session_id` in `localStorage`, and
  uses it for subsequent messages.

**FR-2.2** A **"New Session"** button is displayed in the chat header, directly
next to the "AI Chat" title.

**FR-2.3** Clicking "New Session":
1. Calls `POST /agent/sessions` to create a fresh backend session.
2. Overwrites `session_id` in `localStorage` with the new value.
3. Clears the in-memory message list and any persisted message history from
   `localStorage`.

**FR-2.4** The "New Session" button is disabled while a message is in-flight
(waiting for an agent reply) to prevent session switching during a request.

---

### 3. Message Persistence

**FR-3.1** After every change to the message list (new user message, new
assistant reply, error message), the full list is written to `localStorage`
under a fixed key (e.g. `"chat_messages"`).

**FR-3.2** On component mount the persisted message list is read from
`localStorage` and pre-populated into the chat. If no persisted messages are
found, the chat starts empty.

**FR-3.3** When "New Session" is clicked the persisted message list is cleared
from `localStorage` simultaneously with the new session creation.

---

### 4. Sending Messages

**FR-4.1** When the user submits a message:
1. The user's message is appended to the message list immediately.
2. A temporary "typing" assistant message (showing `...` or equivalent) is
   appended.
3. `POST /agent/chat` is called with `{ user_id, session_id, message }`.
4. On success the typing message is replaced by the agent's reply.
5. On failure the typing message is replaced by an error message (see FR-5).

**FR-4.2** The text input and Send button are **disabled** from the moment the
user submits a message until the agent reply (or error) arrives.

**FR-4.3** The Enter key continues to trigger send (existing behaviour is
preserved).

---

### 5. Error Handling

**FR-5.1** If `POST /agent/chat` fails (network error or non-2xx response), the
typing bubble is replaced with an inline error message in the assistant bubble
(e.g. *"Something went wrong. Please try again."*). The input is re-enabled.
The failed user message remains in the list.

**FR-5.2** **Stale session auto-recovery:** If a chat request fails and the
error suggests the session is invalid or expired, the component:
1. Silently calls `POST /agent/sessions` to create a new session.
2. Stores the new `session_id` in `localStorage`.
3. Clears message history (localStorage and UI).
4. Informs the user with an inline system message (e.g. *"Session expired.
   Starting a new conversation."*).

The distinction between a generic error (FR-5.1) and a stale-session error
(FR-5.2) may need to be refined during design once the exact HTTP status/body
returned by the backend for an invalid session is known.

**FR-5.3** If the initial session creation on mount fails (no existing
`session_id` and `POST /agent/sessions` returns an error), the input is
disabled and an inline message tells the user the chat is unavailable.

---

### 6. Loading State

**FR-6.1** While any backend call is in-flight (session creation or chat), a
`...` typing bubble is visible as the last message in the chat list.

**FR-6.2** The scroll position follows the bottom of the message list
(existing behaviour is preserved).

---

## Acceptance Criteria

| # | Scenario | Expected result |
|---|---|---|
| AC-1 | First-time visitor | `user_id` generated and saved; `POST /agent/sessions` called; `session_id` saved. |
| AC-2 | Returning visitor | Existing `user_id` and `session_id` read from `localStorage`; no session call on mount. |
| AC-3 | User sends a message | User bubble appears immediately; typing bubble shows; reply replaces it. |
| AC-4 | Network error on chat | Typing bubble replaced by error text; input re-enabled. |
| AC-5 | User clicks "New Session" | New session created; messages cleared in UI and `localStorage`. |
| AC-6 | Page reload | Prior messages restored; same session reused. |
| AC-7 | Stale session detected | New session created silently; chat cleared; system notice shown. |

---

## Out of Scope

- **Multi-session history** — browsing or switching between past sessions is not
  included. Only one session is active at a time.
- **Server-side message retrieval** — messages are stored client-side only; the
  backend is not queried to restore chat history.
- **Authentication** — `user_id` is an anonymous client-generated identifier,
  not tied to any login system.
- **Streaming replies** — the backend returns a complete reply string; streaming
  token-by-token display is not required.
- **Message editing or deletion** — users cannot edit or remove sent messages.
- **i18n / a11y** — no multilingual support or WCAG compliance requirements are
  in scope for this feature.
- **Content page** and other non-chat UI areas remain unchanged.

---

## Open Questions / Assumptions

- **Stale session detection:** The backend returns HTTP 502 for most agent
  errors. It is assumed that session validity can be inferred from the error
  response body. The exact discriminator (status code, error string) must be
  confirmed during design against the live backend.
- **localStorage key names** are implementation details left to design.
- **UUID generation:** The browser's `crypto.randomUUID()` is assumed available
  (all modern browsers). A polyfill is not required.
