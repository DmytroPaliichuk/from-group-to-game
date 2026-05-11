# REQ: Show Follow-Up Questions Only Below the Last Agent Response

## Summary

In the AI Chat sidebar, each assistant message can carry a list of follow-up question buttons. Currently those buttons are rendered below every assistant message that has them. This feature changes that: follow-up buttons must only be visible under the **most recent** assistant message; all earlier follow-up buttons must be hidden.

---

## Actors

- **End user** — interacts with the chat sidebar by reading agent replies and optionally clicking a follow-up question.

---

## Primary Flow

1. User sends a message (typed or clicked follow-up).
2. All visible follow-up buttons disappear **immediately** — before the agent reply arrives.
3. Agent replies; its follow-up buttons are shown below its message.
4. If the user sends another message, the current follow-up buttons disappear immediately (step 2 repeats).

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | At any point in time, follow-up buttons are visible for **at most one** assistant message — the most recent non-typing assistant message. |
| AC-2 | Follow-up buttons on all earlier assistant messages are **not rendered** (not just hidden with `display:none`). |
| AC-3 | Follow-up buttons disappear **as soon as the user submits** a message (typed or clicked follow-up), not after the agent reply lands. |
| AC-4 | During the agent's typing indicator, no follow-up buttons are visible anywhere in the conversation. |
| AC-5 | When the agent's reply arrives with follow-ups, those buttons appear below the new response. |
| AC-6 | No animation or transition — follow-ups vanish and appear instantly. |
| AC-7 | Clicking a follow-up still sends the question text and behaves identically to typing it. |

---

## Edge Cases

- **No follow-ups in reply:** If the latest assistant message carries an empty `followups` array, no buttons are rendered (existing behavior, unchanged).
- **Session reset / new session:** After a session reset, the message list is cleared; no follow-ups are visible until the next agent reply that includes them.
- **Restored conversation from localStorage:** Messages are rehydrated without follow-ups (follow-ups are already stripped on save). No follow-up buttons appear for historical messages on page load.

---

## Out of Scope

- Animations or transitions for follow-up button appearance/disappearance.
- Storing or replaying which follow-ups were shown for a given message.
- Changing how follow-up data is fetched or returned by the API.
- Any changes to the typing indicator or loading state beyond what is implied by AC-3/AC-4.
- Mobile-specific layout changes.

---

## Open Questions / Assumptions

- **Assumption:** "Last agent response" means the last message in the `messages` array with `role === 'assistant'` and `typing !== true`. This is deterministic given the current append-only message list structure.
- No open questions remain after Q&A.
