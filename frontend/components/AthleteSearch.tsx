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
}

const RESULT_CAP = 8

export default function AthleteSearch({ athletes, selectedIds, onSelect, onRemove }: AthleteSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
    <div ref={containerRef} className="relative flex items-center gap-2">
      <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>Athlete</span>

      <div className="flex items-center gap-1 flex-wrap bg-[#1A1A1A] rounded px-2 h-[30px] min-w-[160px] max-w-[320px] overflow-hidden">
        {[...selectedIds].map(id => {
          const a = athletes[id]
          if (!a) return null
          return (
            <span key={id} className="flex items-center gap-1 bg-[#334155] text-[#e2e8f0] text-xs rounded px-1.5 py-0.5 flex-shrink-0">
              {a.fullName}
              <button
                aria-label={`Remove ${a.fullName}`}
                onClick={() => onRemove(id)}
                className="text-[#94a3b8] hover:text-white leading-none"
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
          className="bg-transparent text-[#f1f5f9] text-sm outline-none min-w-[80px] flex-1"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 rounded-xl min-w-[200px] overflow-hidden"
          style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          {matches.length === 0
            ? <span className="block text-[#94a3b8] text-sm italic px-3 py-2">No results</span>
            : matches.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSelect(a.id)}
                  className="block w-full text-left text-[#e2e8f0] text-sm px-3 py-1.5 hover:bg-[#334155] transition-colors"
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
