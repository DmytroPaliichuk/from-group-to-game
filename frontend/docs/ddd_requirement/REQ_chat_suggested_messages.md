# REQ: Chat Suggested Messages

## Summary

When the chat panel contains no messages (on first load or after a "New Chat" reset), display three pre-written suggestion chips in the message area. The chips disappear as soon as the user sends any message. Clicking a chip immediately sends it as a user message, identical to typing and pressing Enter.

---

## Actors

- **End user** — anyone interacting with the chat panel in the app.

---

## Primary Flow

1. User opens the app (or clicks "New Chat") — the message list is empty.
2. The message area shows three suggestion chips instead of (or replacing) the current empty-state placeholder text.
3. User clicks one chip.
4. The chip text is sent as a user message immediately; the suggestions disappear; normal chat flow continues.

Alternative: the user types and sends their own message instead of clicking a chip — the suggestions disappear all the same.

---

## Suggestion Chip Content (fixed, in order)

1. "Do we have any athletes from Los Angeles?"
2. "Show me athletes from California"
3. "Which athlete has secured a greater number of gold medals?"

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| 1 | Chips are visible whenever `messages.length === 0` and chat is not unavailable. |
| 2 | Chips are not visible when `messages.length > 0`. |
| 3 | Chips appear in the scrollable message area (same region as the current empty-state text). |
| 4 | Clicking a chip sends that text as a user message immediately (no extra confirmation or input-field step). |
| 5 | After sending, the chips do not reappear for the remainder of that session. |
| 6 | After clicking "New Chat" (which resets `messages` to `[]`), the chips reappear. |
| 7 | While a message is being sent (`isLoading === true`) or chat is unavailable, chips are either hidden or non-interactive (consistent with how other interactive elements are disabled). |

---

## Errors & Edge Cases

- **Chat unavailable state:** when `chatUnavailable` is true the empty-state already shows an error message; chips should not compete with that message — hide chips in this state.
- **localStorage with saved messages:** if a returning user has saved messages, `messages.length > 0` on load, so chips are never shown — no special handling needed.
- **Concurrent send:** if the user somehow triggers two sends (e.g. double-click), the existing `isLoading` guard already prevents duplicate sends; chips should be disabled (or hidden) while loading.

---

## Non-Functionals

- No network requests introduced by this feature; all three suggestions are static strings defined in the component.
- The chip styling should match the existing `followups` pill style (`#e2f6d5` background, `#163300` text, pill-shaped border-radius, Inter font, 12 px, 600 weight) for visual consistency.

---

## Out of Scope

- Making the suggestion list dynamic (fetched from an API or configurable at runtime).
- Personalising suggestions based on user history or filters.
- Showing suggestions at any point other than when the message list is empty.
- Any changes to the input bar, header, or map components.
