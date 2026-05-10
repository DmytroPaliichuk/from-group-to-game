'use client'

import { useState, useRef, useEffect } from 'react'

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

export interface CityEntry {
  key: string  // "city|state", e.g. "Los Angeles|CA"
  city: string
  state: string   // abbreviation, e.g. "CA"
  label: string   // dropdown display: "California — Los Angeles"
}

interface CitySearchProps {
  cities: CityEntry[]
  selectedKeys: Set<string>
  onSelect: (key: string) => void
  onRemove: (key: string) => void
  className?: string
  clearSignal?: number
}

const RESULT_CAP = 8

export default function CitySearch({ cities, selectedKeys, onSelect, onRemove, className, clearSignal }: CitySearchProps) {
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

  const matches: CityEntry[] = query.trim().length === 0
    ? []
    : cities
        .filter(c => !selectedKeys.has(c.key))
        .filter(c => c.city.toLowerCase().includes(query.toLowerCase()))
        .slice(0, RESULT_CAP)

  function handleSelect(key: string) {
    onSelect(key)
    setQuery('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setIsOpen(e.target.value.trim().length > 0)
  }

  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 ${className ?? ''}`}>
      <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>City</span>

      <div className="flex items-center gap-1 flex-wrap bg-[#1A1A1A] rounded px-2 h-[30px] min-w-[160px] flex-1 overflow-hidden">
        {[...selectedKeys].map(key => {
          const c = cities.find(c => c.key === key)
          if (!c) return null
          return (
            <span key={key} className="flex items-center gap-1 bg-[#334155] text-[#e2e8f0] text-xs rounded px-1.5 py-0.5 flex-shrink-0">
              {c.city}
              <button
                aria-label={`Remove ${c.city}`}
                onClick={() => onRemove(key)}
                className="text-[#94a3b8] hover:text-white leading-none"
              >
                ×
              </button>
            </span>
          )
        })}
        <input
          aria-label="Search cities by name"
          placeholder={selectedKeys.size === 0 ? 'Search cities…' : ''}
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
            : matches.map(c => (
                <button
                  key={c.key}
                  onClick={() => handleSelect(c.key)}
                  className="block w-full text-left text-[#e2e8f0] text-sm px-3 py-1.5 hover:bg-[#334155] transition-colors"
                >
                  {c.label}
                </button>
              ))
          }
        </div>
      )}
    </div>
  )
}
