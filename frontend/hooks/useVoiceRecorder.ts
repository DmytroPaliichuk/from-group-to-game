'use client'

import { useEffect, useRef, useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type MicState = 'idle' | 'recording' | 'processing'

const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ''
const MAX_RECORDING_MS = 60_000

// btoa spread fails on large typed arrays; iterate instead
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function useVoiceRecorder({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void
  disabled: boolean
}): {
  micState: MicState
  error: string | null
  handleMicClick: () => void
} {
  const [micState, setMicState] = useState<MicState>('idle')
  const [error, setError] = useState<string | null>(null)

  const recorderRef    = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const autoStopRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showError(msg: string) {
    setError(msg)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => setError(null), 3_000)
  }

  async function transcribe(blob: Blob) {
    setMicState('processing')
    try {
      const base64 = arrayBufferToBase64(await blob.arrayBuffer())
      const model = new GoogleGenerativeAI(GEMINI_KEY).getGenerativeModel({
        model: 'gemini-2.5-flash',
      })
      // Gemini rejects codec suffixes like "audio/webm;codecs=opus" — strip them
      const mimeType = (blob.type || 'audio/webm').split(';')[0]
      const result = await model.generateContent([
        'Transcribe the following audio accurately. Return only the transcribed text, nothing else.',
        { inlineData: { data: base64, mimeType } },
      ])
      const text = result.response.text().trim()
      if (text) onTranscript(text)
    } catch (err) {
      console.error('[useVoiceRecorder] transcription error:', err)
      showError('Transcription failed. Please try again.')
    } finally {
      setMicState('idle')
    }
  }

  function stopRecording() {
    if (autoStopRef.current) clearTimeout(autoStopRef.current)
    recorderRef.current?.stop()
    recorderRef.current = null
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      chunksRef.current = []
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        transcribe(new Blob(chunksRef.current, { type: recorder.mimeType }))
      }

      recorder.start()
      recorderRef.current = recorder
      setMicState('recording')

      // auto-stop at 60 seconds to prevent huge blobs
      autoStopRef.current = setTimeout(stopRecording, MAX_RECORDING_MS)
    } catch {
      showError('Microphone access denied.')
    }
  }

  function handleMicClick() {
    if (disabled || micState === 'processing') return
    if (micState === 'idle') startRecording()
    else stopRecording()
  }

  useEffect(() => {
    return () => {
      if (autoStopRef.current) clearTimeout(autoStopRef.current)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      recorderRef.current?.stop()
    }
  }, [])

  return { micState, error, handleMicClick }
}
