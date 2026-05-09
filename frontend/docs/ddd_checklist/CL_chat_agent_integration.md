# CL: Chat Agent Integration

**Design:** `docs/ddd_design/DES_chat_agent_integration.md`
**Requirement:** `docs/ddd_requirement/REQ_chat_agent_integration.md`

---

## Tasks

### Task 1 — Environment variable + Chat logic rewrite
**Status:** `completed`
**Files:** `.env.local`, `components/Chat.tsx`

Implemented:
- `.env.local`: added `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `Message` interface extended: `role: 'user' | 'assistant' | 'system'`, `typing?: boolean`
- localStorage key constants: `LS_USER_ID`, `LS_SESSION_ID`, `LS_MESSAGES`
- New state: `sessionId`, `isLoading`, `chatUnavailable`; `userId` as `useRef`
- `isFirstRender` ref guards the persistence effect from overwriting localStorage
  before the init effect has restored saved messages
- `useEffect` (mount): resolves/generates `user_id`, restores messages,
  restores or creates `session_id`; uses a `cancelled` flag to guard async state
  updates after unmount
- `useEffect` (persistence): writes messages to localStorage on every change,
  skipping `typing: true` entries; skips the first render
- `callCreateSession()` module-level async helper (avoids stale-closure deps in
  the init effect)
- `send()`: optimistic user bubble → typing bubble → `POST /agent/chat` →
  success / 4xx stale-session recovery / 5xx generic error branch
- `handleKeyDown`: guarded on `isLoading`
- JSX: `disabled` props on input and Send button; layout otherwise unchanged

Note: `newSession()` is deferred to Task 2 to avoid an unused-variable lint
error before the New Session button exists.

---

### Task 2 — JSX: New Session button + system message rendering
**Status:** `completed`
**Files:** `components/Chat.tsx`
**Depends on:** Task 1

Update the JSX return to complete the UI design, and add `newSession()` handler:

- Add `newSession()` handler: calls `callCreateSession()`, clears state and
  localStorage (deferred from Task 1 to avoid unused-variable lint error)
- Header `div`: add `justify-between` so title and button sit at opposite ends
- Add the "New Session" ghost-outline button to the right of "AI Chat":
  `border border-[#334155] text-[#94a3b8] hover:border-slate-500
  hover:text-[#f1f5f9] text-xs px-2 py-1 rounded disabled:opacity-40
  disabled:cursor-not-allowed`, disabled when `isLoading || chatUnavailable`
- Message list: add a render branch for `role === 'system'` messages
  (`text-[#71717A] text-xs italic text-center`, full-width, no bubble)
- Show chat-unavailable hint when `chatUnavailable` is true and messages list
  is empty (replaces generic "Send a message to get started." empty state)
