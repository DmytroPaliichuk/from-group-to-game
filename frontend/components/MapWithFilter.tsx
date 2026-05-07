'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import UsMap from './UsMap'
import topStateCities from '@/public/topStateSities.json'

interface City {
  city: string
  state: string
  lat: number
  lng: number
  athletes: {
    first_name: string
    last_name: string
    olympic_paralympic: string
    seasons: string[]
    medals: { gold: number; silver: number; bronze: number }
    sports: string[]
  }[]
}

export default function MapWithFilter({ cities, onContentPage }: { cities: City[]; onContentPage?: () => void }) {
  const [selectedState, setSelectedState] = useState('')
  const [gameFilter, setGameFilter] = useState(new Set(['Olympian', 'Paralympian']))
  const [seasonFilter, setSeasonFilter] = useState(new Set(['Summer', 'Winter']))
  const [medalFilter, setMedalFilter] = useState(new Set<string>())
  const [sportFilter, setSportFilter] = useState('')
  const [sportOpen, setSportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function toggleGame(type: string) {
    setGameFilter(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function toggleSeason(type: string) {
    setSeasonFilter(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const allSports = useMemo(() =>
    [...new Set(cities.flatMap(c => c.athletes.flatMap(a => a.sports)))].sort()
  , [cities])

  useEffect(() => {
    if (!sportOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setSportOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sportOpen])

  function toggleMedal(type: string) {
    setMedalFilter(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const filtered =(selectedState ? cities.filter(c => c.state === selectedState) : cities)
    .map(city => ({
      ...city,
      athletes: city.athletes.filter(a => {
        const gameMatch = gameFilter.size === 0 || gameFilter.size === 2 || gameFilter.has(a.olympic_paralympic)
        const seasonMatch = seasonFilter.size === 0 || seasonFilter.size === 2 || a.seasons.some(s => seasonFilter.has(s))
        const medalMatch = medalFilter.size === 0 || [...medalFilter].every(m => a.medals[m as keyof typeof a.medals] > 0)
        const sportMatch = sportFilter === '' || a.sports.includes(sportFilter)
        return gameMatch && seasonMatch && medalMatch && sportMatch
      })
    }))
    .filter(c => c.athletes.length > 0)

  const stateCities = selectedState ? (topStateCities[selectedState as keyof typeof topStateCities] ?? []) : []

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0f172a] rounded-lg border border-[#1A1A1A] p-4 gap-3 overflow-hidden">
      <div className="flex items-center h-[52px] gap-8 flex-shrink-0">
        {/* Game toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>Game</span>
          <div className="flex gap-0.5 p-0.5 bg-[#0f172a] rounded-lg">
            {(['Olympian', 'Paralympian'] as const).map((type, i) => (
              <button
                key={type}
                onClick={() => toggleGame(type)}
                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all
                  ${gameFilter.has(type) ? 'border-[#06B6D4] opacity-100' : 'border-[#475569] opacity-55'}`}
              >
                <Image
                  src={i === 0 ? '/images/opympian_games.png' : '/images/paralympian_games.png'}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  alt={type}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Season toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>Season</span>
          <div className="flex gap-0.5 p-0.5 bg-[#0f172a] rounded-lg">
            {(['Summer', 'Winter'] as const).map((season, i) => (
              <button
                key={season}
                onClick={() => toggleSeason(season)}
                className={`w-12 h-12 rounded-md overflow-hidden border-2 bg-white transition-all
                  ${seasonFilter.has(season) ? 'border-[#06B6D4] opacity-100' : 'border-transparent opacity-30'}`}
              >
                <Image
                  src={i === 0 ? '/images/summer_games_emblem_dark_mode.png' : '/images/winter_games_emblem_dark_mode.png'}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  alt={season}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Medal toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>Medals</span>
          <div className="flex gap-0.5 p-0.5 bg-[#0f172a] rounded-lg items-center">
            {([
              { key: 'gold',   src: '/images/generated-1778004985438.png' },
              { key: 'silver', src: '/images/generated-1778004981207.png' },
              { key: 'bronze', src: '/images/generated-1778004987440.png' },
            ] as const).map(({ key, src }) => (
              <button
                key={key}
                onClick={() => toggleMedal(key)}
                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all
                  ${medalFilter.has(key) ? 'border-[#06B6D4] opacity-100' : 'border-[#475569] opacity-55'}`}
              >
                <Image
                  src={src}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  alt={key}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Sport Disciplines dropdown */}
        <div ref={dropdownRef} className="relative flex items-center gap-2">
          <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>Sport</span>
          <div
            onClick={() => setSportOpen(o => !o)}
            className="flex items-center gap-1 h-[30px] bg-[#1A1A1A] rounded px-2 cursor-pointer"
          >
            <span className="text-[#f1f5f9] text-sm">{sportFilter || 'All Disciplines'}</span>
            <span className="text-[#71717A] text-xs">▾</span>
          </div>
          {sportOpen && (
            <div className="absolute top-full mt-1 left-0 bg-[#1A1A1A] border border-[#334155] rounded z-50 max-h-60 overflow-y-auto min-w-[160px]">
              <button
                onClick={() => { setSportFilter(''); setSportOpen(false) }}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-[#334155] ${sportFilter === '' ? 'text-[#06B6D4]' : 'text-[#f1f5f9]'}`}
              >
                All Disciplines
              </button>
              {allSports.map(sport => (
                <button
                  key={sport}
                  onClick={() => { setSportFilter(sport); setSportOpen(false) }}
                  className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-[#334155] ${sportFilter === sport ? 'text-[#06B6D4]' : 'text-[#f1f5f9]'}`}
                >
                  {sport}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content page button */}
        {onContentPage && (
          <button
            onClick={onContentPage}
            className="ml-auto h-12 bg-[#0B9FEA] hover:bg-[#0a8fd4] text-white text-sm font-medium px-6 rounded-full transition-colors flex-shrink-0"
          >
            Content Page &gt;&gt;
          </button>
        )}
      </div>

      <UsMap cities={filtered} selectedState={selectedState || undefined} stateCities={stateCities} onStateSelect={setSelectedState} />
    </div>
  )
}
