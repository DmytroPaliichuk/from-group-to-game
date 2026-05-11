# CL: Chat Suggested Messages

Refs: [REQ](../ddd_requirement/REQ_chat_suggested_messages.md) · [DES](../ddd_design/DES_chat_suggested_messages.md)

---

## Tasks

### Task 1 — Add suggestion chips to Chat empty state `completed`

**File:** `components/Chat.tsx`

1. Add a `SUGGESTED_MESSAGES` constant (3 strings) above the `Chat` component.
2. Replace the single empty-state `<p>` block with two separate blocks:
   - Error text block: shown when `messages.length === 0 && chatUnavailable`.
   - Chips block: shown when `messages.length === 0 && !chatUnavailable && !isLoading`; renders one `<button>` per suggestion using the `followups` pill style; `onClick` calls `sendText(text)`.
