# CL: Show Follow-Up Questions Only Below the Last Agent Response

Design doc: `docs/ddd_design/DES_chat_followups_last_only.md`
Requirements: `docs/ddd_requirement/REQ_chat_followups_last_only.md`

---

## Tasks

### Task 1 — Gate follow-up buttons to the last assistant message · `completed`

**File:** `components/Chat.tsx`

**Changes:**
1. Before the `messages.map(...)` call in the return, derive `lastAssistantIdx`:
   ```ts
   const lastAssistantIdx = messages.reduce(
     (last, msg, i) => (msg.role === 'assistant' && !msg.typing ? i : last),
     -1,
   )
   ```
2. Add `i === lastAssistantIdx` to the follow-up block guard (line 259):
   ```tsx
   {!msg.typing && i === lastAssistantIdx && (msg.followups && msg.followups.length > 0) && (
   ```

**Done when:** Follow-up buttons appear only under the latest non-typing assistant message. All earlier follow-up buttons are absent from the DOM. Buttons vanish immediately on submit (while the typing indicator is active).
