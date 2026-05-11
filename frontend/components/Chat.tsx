'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles, Mic, ArrowRight } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  text: string
  typing?: boolean
  followups?: string[]
}

const SUGGESTED_MESSAGES = [
  'Do we have any athletes from Los Angeles?',
  'Show me athletes from California',
  'Which athlete has secured a greater number of gold medals?',
] as const

const LS_USER_ID    = 'fg2g_user_id'
const LS_SESSION_ID = 'fg2g_session_id'
const LS_MESSAGES   = 'fg2g_chat_messages'
const API_BASE      = process.env.NEXT_PUBLIC_API_URL ?? ''

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

export default function Chat({
  onApplyFilters,
}: {
  onApplyFilters?: (filters: Record<string, string[]>) => void
}) {
  const userId        = useRef<string>('')
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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    localStorage.setItem(
      LS_MESSAGES,
      JSON.stringify(
        messages
          .filter(m => !m.typing)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ followups: _f, ...rest }) => rest),
      ),
    )
  }, [messages])

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

  async function sendText(text: string) {
    if (!text || isLoading || !sessionId) return

    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: '...', typing: true },
    ])
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId.current, session_id: sessionId, message: text }),
      })

      if (res.ok) {
        const data: {
          reply: string
          filters?: Record<string, string[]>
          followups?: string[]
        } = await res.json()
        if (data.filters && Object.keys(data.filters).length > 0) {
          onApplyFilters?.(data.filters)
        }
        setMessages(prev => [
          ...prev.filter(m => !m.typing),
          { role: 'assistant', text: data.reply, followups: data.followups ?? [] },
        ])
      } else if (res.status >= 400 && res.status < 500) {
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

  function send() {
    const text = input.trim()
    setInput('')
    sendText(text)
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

  const lastAssistantIdx = messages.reduce(
    (last, msg, i) => (msg.role === 'assistant' && !msg.typing ? i : last),
    -1,
  )

  return (
    <aside style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: '#ffffff',
      borderRadius: 30,
      border: '1px solid rgba(14,15,12,0.10)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px',
        borderBottom: '1px solid rgba(14,15,12,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#9fe870',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={14} color="#163300" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 14, color: '#0e0f0c' }}>Ask OlymPick</div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#868685', fontWeight: 500 }}>Online</div>
          </div>
        </div>
        <button
          onClick={newSession}
          disabled={isLoading || chatUnavailable}
          style={{
            background: '#e2f6d5',
            color: '#163300',
            border: 'none',
            borderRadius: 9999,
            padding: '7px 12px',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: (isLoading || chatUnavailable) ? 0.5 : 1,
          }}
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && chatUnavailable && (
          <p style={{ color: '#868685', fontSize: 14, textAlign: 'center', marginTop: 32 }}>
            Chat is unavailable. Please reload the page.
          </p>
        )}

        {messages.length === 0 && !chatUnavailable && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 32 }}>
            {SUGGESTED_MESSAGES.map(text => (
              <button
                key={text}
                onClick={() => sendText(text)}
                style={{
                  background: '#e2f6d5',
                  color: '#163300',
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: 9999,
                  fontFamily: 'Inter',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'system') {
            return (
              <p key={i} style={{ color: '#868685', fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>
                {msg.text}
              </p>
            )
          }

          if (msg.role === 'user') {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '80%',
                  background: '#0e0f0c',
                  color: '#fafaf7',
                  padding: '10px 16px',
                  borderRadius: '20px 20px 4px 20px',
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.45,
                }}>
                  {msg.text}
                </div>
              </div>
            )
          }

          // assistant
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div style={{
                maxWidth: '88%',
                background: '#ffffff',
                color: '#0e0f0c',
                padding: '12px 16px',
                borderRadius: '4px 20px 20px 20px',
                fontFamily: 'Inter',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.55,
                boxShadow: 'rgba(14,15,12,0.10) 0 0 0 1px',
              }}>
                {msg.typing ? (
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
                    {[0, 150, 300].map(delay => (
                      <span key={delay} style={{ width: 8, height: 8, borderRadius: '50%', background: '#868685', display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                ) : (
                  <div className="[&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold [&_em]:italic [&_code]:bg-[#f0f0ee] [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[#f0f0ee] [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_h1]:font-bold [&_h1]:text-base [&_h2]:font-semibold [&_h3]:font-semibold">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>

              {!msg.typing && i === lastAssistantIdx && (msg.followups && msg.followups.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 2 }}>
                  {msg.followups.map(q => (
                    <button
                      key={q}
                      onClick={() => !isLoading && sendText(q)}
                      disabled={isLoading}
                      style={{
                        background: '#e2f6d5',
                        color: '#163300',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: 9999,
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      {q} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div style={{ padding: '14px 22px 20px', borderTop: '1px solid rgba(14,15,12,0.10)', flexShrink: 0 }}>
        <form
          onSubmit={e => { e.preventDefault(); send() }}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: 9999,
            padding: '6px 6px 6px 18px',
            boxShadow: 'rgba(14,15,12,0.12) 0 0 0 1px',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the Games…"
            disabled={isLoading || chatUnavailable}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Inter',
              fontSize: 14,
              fontWeight: 500,
              padding: '8px 4px',
              color: '#0e0f0c',
            }}
          />
          <button
            type="button"
            style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Mic size={14} color="#454745" />
          </button>
          <button
            type="submit"
            disabled={isLoading || chatUnavailable}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#9fe870',
              color: '#163300',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (isLoading || chatUnavailable) ? 0.5 : 1,
            }}
          >
            <ArrowRight size={14} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </aside>
  )
}
