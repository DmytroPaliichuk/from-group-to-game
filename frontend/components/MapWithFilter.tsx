'use client'

import { useState } from 'react'
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
  }[]
}

export default function MapWithFilter({ cities, onContentPage }: { cities: City[]; onContentPage?: () => void }) {
  const [selectedState, setSelectedState] = useState('')
  const [gameFilter, setGameFilter] = useState(new Set(['Olympian', 'Paralympian']))
  const [seasonFilter, setSeasonFilter] = useState(new Set(['Summer', 'Winter']))
  const [medalFilter, setMedalFilter] = useState(new Set<string>())

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

  function toggleMedal(type: string) {
    setMedalFilter(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const states = [...new Set(cities.map(c => c.state))].sort()

  const filtered = (selectedState ? cities.filter(c => c.state === selectedState) : cities)
    .map(city => ({
      ...city,
      athletes: city.athletes.filter(a => {
        const gameMatch = gameFilter.size === 0 || gameFilter.size === 2 || gameFilter.has(a.olympic_paralympic)
        const seasonMatch = seasonFilter.size === 0 || seasonFilter.size === 2 || a.seasons.some(s => seasonFilter.has(s))
        const medalMatch = medalFilter.size === 0 || [...medalFilter].every(m => a.medals[m as keyof typeof a.medals] > 0)
        return gameMatch && seasonMatch && medalMatch
      })
    }))
    .filter(c => c.athletes.length > 0)

  const stateCities = selectedState ? (topStateCities[selectedState as keyof typeof topStateCities] ?? []) : []

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-800 rounded-2xl p-4 overflow-hidden">
      <div className="mb-3 flex items-center gap-8">
        {/* State filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="state-filter" className="text-sm text-slate-400">
            State
          </label>
          <select
            id="state-filter"
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="bg-slate-700 text-slate-100 border border-slate-600 rounded px-2 py-1 text-sm"
          >
            <option value="">All States</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Game toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Game</span>
          <div className="flex gap-0.5 p-0.5 bg-slate-950 rounded-lg">
            {(['Olympian', 'Paralympian'] as const).map((type, i) => (
              <button
                key={type}
                onClick={() => toggleGame(type)}
                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all
                  ${gameFilter.has(type) ? 'border-sky-400 opacity-100' : 'border-transparent opacity-40'}`}
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
          <span className="text-sm text-slate-400">Season</span>
          <div className="flex gap-0.5 p-0.5 bg-slate-950 rounded-lg">
            {(['Summer', 'Winter'] as const).map((season, i) => (
              <button
                key={season}
                onClick={() => toggleSeason(season)}
                className={`w-12 h-12 rounded-md overflow-hidden border-2 bg-white transition-all
                  ${seasonFilter.has(season) ? 'border-sky-400 opacity-100' : 'border-transparent opacity-40'}`}
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
          <span className="text-sm text-slate-400">Medals</span>
          <div className="flex gap-0.5 p-0.5 bg-slate-950 rounded-lg">
            {([
              { key: 'gold',   label: 'G', bg: '#FFD700', text: '#92400e' },
              { key: 'silver', label: 'S', bg: '#94a3b8', text: '#1e293b' },
              { key: 'bronze', label: 'B', bg: '#cd7f32', text: '#ffffff' },
            ] as const).map(({ key, label, bg, text }) => (
              <button
                key={key}
                onClick={() => toggleMedal(key)}
                style={{ backgroundColor: bg, color: text }}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all
                  ${medalFilter.has(key) ? 'border-sky-400 opacity-100' : 'border-transparent opacity-40'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content page button */}
        {onContentPage && (
          <button
            onClick={onContentPage}
            className="ml-auto bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm px-4 py-2 rounded-xl border border-slate-600 transition-colors"
          >
            Content Page &gt;&gt;
          </button>
        )}
      </div>

      <UsMap cities={filtered} selectedState={selectedState || undefined} stateCities={stateCities} onStateSelect={setSelectedState} />
    </div>
  )
}
