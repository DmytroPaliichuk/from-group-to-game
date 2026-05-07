'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: 'Thinking... (AI agents coming soon)' },
    ])
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send()
  }

  return (
    <aside className="flex flex-col w-full h-full rounded-lg overflow-hidden bg-[#0f172a]">
      <div className="px-4 flex items-center h-[52px] border-b border-[#1A1A1A] flex-shrink-0">
        <h2 className="text-[#f1f5f9] font-semibold text-sm tracking-[0.5px]" style={{ fontFamily: "'Funnel Sans', sans-serif" }}>AI Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-[#71717A] text-sm text-center mt-8">
            Send a message to get started.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <span
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                msg.role === 'user'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#334155] text-[#E2E8F0]'
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#334155] flex gap-3 items-center flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 h-12 bg-[#1E324D] text-[#f1f5f9] placeholder-[#6F86A5] text-sm px-6 rounded-full border-2 border-[#10B4F5] outline-none"
        />
        <button
          onClick={send}
          className="h-12 bg-[#0B9FEA] hover:bg-[#0a8fd4] text-white text-sm font-medium px-6 rounded-full transition-colors flex-shrink-0"
        >
          Send
        </button>
      </div>
    </aside>
  )
}
