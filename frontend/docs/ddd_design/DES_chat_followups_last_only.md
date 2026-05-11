# DES: Show Follow-Up Questions Only Below the Last Agent Response

## Scope

Single-file change in `components/Chat.tsx`. No new components, no new state, no API changes, no new dependencies.

---

## Implementation

### Identifying the last non-typing assistant message

Before the `messages.map(...)` render loop, compute:

```ts
const lastAssistantIdx = messages.reduce(
  (last, msg, i) => (msg.role === 'assistant' && !msg.typing ? i : last),
  -1,
)
```

This is O(n) over the message list and runs on every render — acceptable given typical chat lengths.

### Gating the follow-up buttons

Change the existing render condition from:

```tsx
{!msg.typing && (msg.followups && msg.followups.length > 0) && (
```

to:

```tsx
{!msg.typing && i === lastAssistantIdx && (msg.followups && msg.followups.length > 0) && (
```

No other code changes are required.

### Why AC-3/AC-4 are satisfied without extra state

When the user submits a message, `sendText` appends a user message **and** a typing bubble in the same `setMessages` call. The typing bubble (`{ role: 'assistant', typing: true }`) becomes the new last assistant message (`lastAssistantIdx` now points to it), but it has no `followups`. The condition `!msg.typing` already excludes it, so no follow-up buttons render during loading. Previous messages no longer match `i === lastAssistantIdx`, so their buttons also vanish. The hide happens at the React render triggered by `setMessages` — i.e., immediately on submit.

---

## Data flow

```
User submits
  └─ setMessages([...prev, userMsg, typingBubble])
       └─ re-render
            └─ lastAssistantIdx = index of typingBubble
                 └─ typingBubble.typing === true → condition excludes it
                 └─ all prior assistant messages: i !== lastAssistantIdx → no buttons
                 └─ result: zero follow-up buttons visible  ✓

Agent replies
  └─ setMessages([...filtered, { role:'assistant', text, followups }])
       └─ re-render
            └─ lastAssistantIdx = index of new reply
                 └─ new reply: i === lastAssistantIdx && followups.length > 0 → buttons shown
                 └─ all prior messages: i !== lastAssistantIdx → no buttons
                 └─ result: buttons appear only under latest reply  ✓
```

---

## File changed

| File | Change |
|------|--------|
| `components/Chat.tsx` | Add `lastAssistantIdx` derivation before render loop; add `i === lastAssistantIdx` to follow-up button guard condition |

---

## Testing

Manual smoke test: send two messages that each produce follow-ups; confirm only the latest response shows buttons. Send a third message; confirm buttons vanish immediately while the typing indicator is active.
