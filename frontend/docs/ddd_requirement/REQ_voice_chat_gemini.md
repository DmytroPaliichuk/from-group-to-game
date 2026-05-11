# REQ: Voice Chat via Gemini Speech-to-Text

## Summary

Enable the existing (currently inert) mic button in the chat composer to record the user's voice, send the audio to the Gemini multimodal API for transcription, and place the resulting text into the text input field so the user can review it and send it to the existing OlymPick AI backend.

---

## Actors

| Actor | Description |
|-------|-------------|
| End user | Uses the chat sidebar to ask questions about athletes/games |
| Gemini API | Receives audio and returns a text transcription |
| OlymPick backend | Receives the transcribed text as a regular chat message (unchanged) |

---

## Primary Flow (Happy Path)

1. User opens the chat sidebar; the composer is idle.
2. User taps the **mic button** — recording begins.
3. The mic icon turns **red and pulses** to indicate active recording.
4. While recording is active, the text input and send button remain in their current state (not blocked).
5. User taps the **mic button again** — recording stops.
6. The audio blob is sent to the **Gemini multimodal API** with a transcription prompt.
7. During the Gemini call the mic button shows a loading/processing state (no longer pulsing red; not yet idle).
8. The transcribed text is placed into the **text input field**.
9. The user reviews the text, optionally edits it, and submits via Enter or the send button.
10. The message is processed by the existing `/agent/chat` flow — no changes to the backend call.

---

## Acceptance Criteria

- [ ] Tapping the mic once starts recording; tapping it again stops recording.
- [ ] While recording, the mic icon is visually red and has a pulse animation.
- [ ] After stop, the audio is sent to Gemini; the mic shows a processing/loading indicator until the response returns.
- [ ] On success, the transcribed text appears in the text input field.
- [ ] The user must explicitly press Enter or the send button; text is not auto-sent.
- [ ] If transcription succeeds, the mic returns to its idle state.
- [ ] If the chat is unavailable (`chatUnavailable === true`) or a message is loading (`isLoading === true`), the mic button is disabled (same as the text input and send button).
- [ ] On transcription error, a brief error message appears below the composer bar and dismisses automatically after a few seconds; the mic returns to idle.
- [ ] The mic button does not interfere with typing in the text input or pressing send while not recording.

---

## Error & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Microphone permission denied by browser | Show the error message below the composer: "Microphone access denied." |
| Gemini API returns an error | Show brief error below composer; mic returns to idle; input field unchanged |
| Network failure during Gemini call | Same as API error above |
| User taps mic but speaks nothing (empty audio) | Gemini likely returns empty string; input field stays empty; no error shown |
| User taps mic while a transcription call is in progress | Ignore the tap (mic is in processing state, not tappable) |
| Recording produces very long speech | No explicit length limit at the requirements level; handled by Gemini's limits |

---

## Non-Functionals

- **Privacy**: Audio is sent directly from the browser to the Gemini API; audio is not stored by the app and is not forwarded to the OlymPick backend.
- **Security**: The Gemini API key is stored in `.env.local` as `NEXT_PUBLIC_GEMINI_API_KEY`. This exposes the key in the browser bundle — acceptable for a prototype/internal tool.
- **Accessibility**: The mic button must have an appropriate `aria-label` that changes between "Start recording", "Stop recording", and "Processing" states.

---

## Integrations & Data

| Integration | Detail |
|-------------|--------|
| Gemini API | Multimodal: audio blob + transcription prompt → text response |
| API key env var | `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local` |
| OlymPick `/agent/chat` | Unchanged — receives transcribed text as a regular message |

---

## Out of Scope

- Gemini providing the **AI answer** (the existing `/agent/chat` backend continues to answer).
- Real-time streaming / live voice conversation.
- Text-to-speech (AI reading its answer aloud).
- Auto-sending after transcription (user must confirm manually).
- Auto-stop on silence detection.
- Server-side proxy for the Gemini API key.
- Support for languages other than English (not specified; deferred).

---

## Open Questions / Assumptions

- **Assumption**: The Gemini multimodal API accepts browser-recorded audio formats (WebM/Opus or WAV). Exact format and API endpoint to be confirmed in the design phase.
- **Open**: What Gemini model supports audio input? (e.g., `gemini-1.5-flash`, `gemini-2.0-flash`). To be decided in design.
- **Open**: Is there a maximum recording duration the UX should enforce? Not specified; left to design.
