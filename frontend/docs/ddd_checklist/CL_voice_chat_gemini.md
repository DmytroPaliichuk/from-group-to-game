# CL: Voice Chat via Gemini Speech-to-Text

Design doc: `docs/ddd_design/DES_voice_chat_gemini.md`
Requirements: `docs/ddd_requirement/REQ_voice_chat_gemini.md`

---

## Tasks

### Task 1 — Install SDK, add pulse animation, create `useVoiceRecorder` hook
**Status:** `completed`
**Files:** `package.json`, `app/globals.css`, `hooks/useVoiceRecorder.ts`
**Estimated diff:** ~80 lines

**Steps:**
1. Run `npm install @google/generative-ai` — adds the Google Generative AI SDK.
2. Add `@keyframes pulse` to `app/globals.css` for the recording indicator animation.
3. Create `hooks/useVoiceRecorder.ts` with the full hook implementation:
   - State machine: `idle → recording → processing → idle`
   - `startRecording()` — calls `navigator.mediaDevices.getUserMedia({ audio: true })`, creates a `MediaRecorder`, collects chunks, sets a 60-second auto-stop timer via `setTimeout`.
   - `stopRecording()` — clears the auto-stop timer and calls `recorder.stop()`.
   - `transcribe(blob)` — converts the `Blob` to base64 (`arrayBuffer → Uint8Array → btoa`), calls `GoogleGenerativeAI.getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContent(...)` with the audio inline data and a strict transcription prompt, then calls `onTranscript(text)` on success.
   - `showError(msg)` — sets `error` state and auto-clears it after 3 seconds.
   - `handleMicClick()` — delegates to `startRecording` or `stopRecording` based on current state; no-ops when `disabled` or in `'processing'` state.
   - Cleanup `useEffect` clears all timers and stops any active recorder on unmount.
   - Returns `{ micState, error, handleMicClick }`.

**Acceptance check:**
- `npm run build` passes with no TypeScript errors.
- The hook file exports `useVoiceRecorder` with the correct signature.
- `globals.css` includes `@keyframes pulse`.

---

### Task 2 — Wire `useVoiceRecorder` into `Chat.tsx`
**Status:** `completed`
**Files:** `components/Chat.tsx`
**Estimated diff:** ~35 lines
**Depends on:** Task 1

> Note: ~35 lines is below the 50-line guideline, but this is a clean review boundary (infrastructure vs UI consumer) that pairs well with the `/ddd_imp` approval gate.

**Steps:**
1. Import `useVoiceRecorder` from `@/hooks/useVoiceRecorder`.
2. Inside the `Chat` component, call the hook:
   ```ts
   const { micState, error: voiceError, handleMicClick } = useVoiceRecorder({
     onTranscript: text => setInput(text),
     disabled: isLoading || chatUnavailable,
   })
   ```
3. Replace the current static mic button (lines 419–424 in `Chat.tsx`) with a dynamic version:
   - `onClick={handleMicClick}`
   - `disabled={micState === 'processing' || isLoading || chatUnavailable}`
   - `aria-label` changes with state: `"Start recording"` / `"Stop recording"` / `"Processing..."`
   - `Mic` icon color: `#ef4444` (red) when `recording`, `#454745` (gray) otherwise
   - `animation: 'pulse 1s infinite'` on the button when `micState === 'recording'`
4. Below the `<form>` closing tag (inside the composer `<div>`), add the error display:
   ```tsx
   {voiceError && (
     <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6, paddingLeft: 4, fontFamily: 'Inter' }}>
       {voiceError}
     </p>
   )}
   ```

**Acceptance check:**
- `npm run build` passes with no TypeScript errors.
- Mic button is visually gray at rest, red + pulsing while recording.
- Tapping mic once starts recording; tapping again populates the text input.
- Error message appears below the composer and auto-dismisses after 3 seconds.
- Mic button is disabled when `isLoading` or `chatUnavailable`.

---

## Manual QA (after both tasks)

| Scenario | Expected |
|----------|----------|
| Grant mic, speak, stop | Transcribed text appears in input field |
| Deny mic permission | "Microphone access denied." shown for 3s |
| Speak for 60+ seconds | Auto-stop fires; transcription proceeds |
| Invalid/missing API key | "Transcription failed. Please try again." shown for 3s |
| Chat in `isLoading` state | Mic button is visually disabled |
| Chat unavailable | Mic button is visually disabled |
| Empty utterance | Input stays empty; no error shown |
