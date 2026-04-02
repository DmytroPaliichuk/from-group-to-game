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
    <aside className="flex flex-col w-96 h-screen border-l border-slate-700 bg-slate-900">
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-slate-100 font-semibold text-sm tracking-wide">AI Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">
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
                  ? 'bg-sky-600 text-white rounded-br-sm'
                  : 'bg-slate-700 text-slate-100 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 text-sm px-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          onClick={send}
          className="bg-sky-600 hover:bg-sky-500 text-white text-sm px-4 py-2 rounded-xl transition-colors"
        >
          Send
        </button>
      </div>
    </aside>
  )
}
