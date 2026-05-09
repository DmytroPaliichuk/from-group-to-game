'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant' | 'system'
  text: string
  typing?: boolean
}

const LS_USER_ID    = 'fg2g_user_id'
const LS_SESSION_ID = 'fg2g_session_id'
const LS_MESSAGES   = 'fg2g_chat_messages'
const API_BASE      = process.env.NEXT_PUBLIC_API_URL ?? ''

// Module-level so the init useEffect has no stale-closure dependency on it.
async function callCreateSession(uid: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/agent/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: uid }),
    })
    if (!res.ok) return null
    const data: { session_id: string } = await res.json()
    localStorage.setItem(LS_SESSION_ID, data.session_id)
    return data.session_id
  } catch (err) {
    console.error('[Chat] createSession failed:', err)
    return null
  }
}

export default function Chat() {
  const userId        = useRef<string>('')
  // Skip the first persistence run so init's setMessages(restored) doesn't
  // race with the effect and briefly overwrite localStorage with [].
  const isFirstRender = useRef(true)

  const [sessionId,       setSessionId]       = useState<string | null>(null)
  const [messages,        setMessages]        = useState<Message[]>([])
  const [input,           setInput]           = useState('')
  const [isLoading,       setIsLoading]       = useState(false)
  const [chatUnavailable, setChatUnavailable] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Persist messages after every change; typing bubbles are never saved.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    localStorage.setItem(LS_MESSAGES, JSON.stringify(messages.filter(m => !m.typing)))
  }, [messages])

  // On mount: resolve user_id, restore messages, resolve or create session_id.
  useEffect(() => {
    let cancelled = false

    let uid = localStorage.getItem(LS_USER_ID)
    if (!uid) {
      uid = crypto.randomUUID()
      localStorage.setItem(LS_USER_ID, uid)
    }
    userId.current = uid

    try {
      const saved = localStorage.getItem(LS_MESSAGES)
      if (saved) setMessages(JSON.parse(saved) as Message[])
    } catch {
      // ignore corrupt localStorage data
    }

    const sid = localStorage.getItem(LS_SESSION_ID)
    if (sid) {
      setSessionId(sid)
      return
    }

    // No stored session — create one now.
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'assistant', text: '...', typing: true }])

    callCreateSession(uid).then(newSid => {
      if (cancelled) return
      if (newSid) {
        setSessionId(newSid)
        setMessages(prev => prev.filter(m => !m.typing))
      } else {
        setChatUnavailable(true)
        setMessages(prev => [
          ...prev.filter(m => !m.typing),
          { role: 'system', text: 'Chat is unavailable right now. Please try again later.' },
        ])
      }
      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  async function send() {
    const text = input.trim()
    if (!text || isLoading || !sessionId) return

    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: '...', typing: true },
    ])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId.current, session_id: sessionId, message: text }),
      })

      if (res.ok) {
        const data: { reply: string } = await res.json()
        setMessages(prev => [
          ...prev.filter(m => !m.typing),
          { role: 'assistant', text: data.reply },
        ])
      } else if (res.status >= 400 && res.status < 500) {
        // 4xx → stale session; silently recover with a new one.
        const newSid = await callCreateSession(userId.current)
        localStorage.removeItem(LS_MESSAGES)
        if (newSid) {
          setSessionId(newSid)
          setMessages([{ role: 'system', text: 'Session expired. Starting a new conversation.' }])
        } else {
          setChatUnavailable(true)
          setMessages([{ role: 'system', text: 'Session expired and could not be renewed. Please reload the page.' }])
        }
      } else {
        setMessages(prev => [
          ...prev.filter(m => !m.typing),
          { role: 'assistant', text: 'Something went wrong. Please try again.' },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        { role: 'assistant', text: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  async function newSession() {
    if (isLoading) return
    setIsLoading(true)
    const newSid = await callCreateSession(userId.current)
    if (newSid) {
      setSessionId(newSid)
      localStorage.removeItem(LS_MESSAGES)
      setMessages([])
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'system', text: 'Could not start a new session. Please try again.' },
      ])
    }
    setIsLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !isLoading) send()
  }

  return (
    <aside className="flex flex-col w-full h-full rounded-lg overflow-hidden bg-[#0f172a]">
      <div className="px-4 flex items-center justify-between h-[52px] border-b border-[#1A1A1A] flex-shrink-0">
        <h2 className="text-[#f1f5f9] font-semibold text-sm tracking-[0.5px]" style={{ fontFamily: "'Funnel Sans', sans-serif" }}>AI Chat</h2>
        <button
          onClick={newSession}
          disabled={isLoading || chatUnavailable}
          className="bg-[#0B9FEA] hover:bg-[#0a8fd4] text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-[#71717A] text-sm text-center mt-8">
            {chatUnavailable ? 'Chat is unavailable. Please reload the page.' : 'Send a message to get started.'}
          </p>
        )}
        {messages.map((msg, i) => {
          if (msg.role === 'system') {
            return (
              <p key={i} className="text-[#71717A] text-xs italic text-center">
                {msg.text}
              </p>
            )
          }
          return (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                  msg.role === 'user'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#334155] text-[#E2E8F0]'
                } ${msg.typing ? 'animate-pulse' : ''}`}
              >
                {msg.role === 'assistant' && !msg.typing ? (
                  <div className="[&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold [&_em]:italic [&_code]:bg-[#1e293b] [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[#1e293b] [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_h1]:font-bold [&_h1]:text-base [&_h2]:font-semibold [&_h3]:font-semibold">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#334155] flex gap-3 items-center flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading || chatUnavailable}
          className="flex-1 h-12 bg-[#1E324D] text-[#f1f5f9] placeholder-[#6F86A5] text-sm px-6 rounded-full border-2 border-[#10B4F5] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={send}
          disabled={isLoading || chatUnavailable}
          className="h-12 bg-[#0B9FEA] hover:bg-[#0a8fd4] text-white text-sm font-medium px-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </aside>
  )
}
