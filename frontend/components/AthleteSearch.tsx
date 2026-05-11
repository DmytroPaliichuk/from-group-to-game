'use client'

import { useState, useRef, useEffect } from 'react'

export interface AthleteEntry {
  id: number
  firstName: string
  lastName: string
  fullName: string
  city: string
  state: string
}

interface AthleteSearchProps {
  athletes: AthleteEntry[]
  selectedIds: Set<number>
  onSelect: (id: number) => void
  onRemove: (id: number) => void
  className?: string
  clearSignal?: number
}

const RESULT_CAP = 8

export default function AthleteSearch({ athletes, selectedIds, onSelect, onRemove, className, clearSignal }: AthleteSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (clearSignal === undefined) return
    setQuery('')
    setIsOpen(false)
  }, [clearSignal])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const matches: AthleteEntry[] = query.trim().length === 0
    ? []
    : athletes
        .filter(a => !selectedIds.has(a.id))
        .filter(a => {
          const q = query.toLowerCase()
          return a.firstName.toLowerCase().includes(q) || a.lastName.toLowerCase().includes(q)
        })
        .slice(0, RESULT_CAP)

  function handleSelect(id: number) {
    onSelect(id)
    setQuery('')
    // dropdown closes naturally: query becomes empty → matches becomes []
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setIsOpen(e.target.value.trim().length > 0)
  }

  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 ${className ?? ''}`}>
      <span className="text-sm text-[#454745]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Athlete</span>

      <div className="flex items-center gap-1 flex-wrap rounded-lg px-3 h-9 min-w-[160px] flex-1 overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgba(14,15,12,0.12)', boxShadow: 'rgba(14,15,12,0.06) 0 1px 3px' }}>
        {[...selectedIds].map(id => {
          const a = athletes[id]
          if (!a) return null
          return (
            <span key={id} className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 flex-shrink-0"
              style={{ background: '#e2f6d5', color: '#163300' }}>
              {a.fullName}
              <button
                aria-label={`Remove ${a.fullName}`}
                onClick={() => onRemove(id)}
                className="leading-none opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </span>
          )
        })}
        <input
          aria-label="Search athletes by name"
          placeholder={selectedIds.size === 0 ? 'Search athletes…' : ''}
          value={query}
          onChange={handleChange}
          className="bg-transparent text-sm outline-none min-w-[80px] flex-1"
          style={{ color: '#0e0f0c' }}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 rounded-2xl min-w-[200px] overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(14,15,12,0.10)', boxShadow: 'rgba(14,15,12,0.12) 0 4px 16px' }}>
          {matches.length === 0
            ? <span className="block text-sm italic px-3 py-2" style={{ color: '#868685' }}>No results</span>
            : matches.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSelect(a.id)}
                  className="block w-full text-left text-sm px-3 py-2 transition-colors"
                  style={{ color: '#0e0f0c' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafaf7')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {a.fullName}
                </button>
              ))
          }
        </div>
      )}
    </div>
  )
}
