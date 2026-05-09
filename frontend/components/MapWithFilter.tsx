'use client'

import { useState, useRef, useEffect } from 'react'
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

const SUMMER_SPORTS = [
  '3x3 Basketball', 'Archery', 'Artistic Gymnastics', 'Artistic Swimming',
  'Badminton', 'Baseball', 'Basketball', 'Beach Volleyball', 'Boccia',
  'Bowling', 'Boxing', 'Breaking', 'Canoe/Kayak', 'Cycling', 'Diving',
  'Equestrian', 'Fencing', 'Field Hockey', 'Goalball', 'Golf', 'Gymnastics',
  'Judo', 'Karate', 'Modern Pentathlon', 'Para Archery', 'Para Judo',
  'Para Powerlifting', 'Para Shooting', 'Para Swimming', 'Para Table Tennis',
  'Para Taekwondo', 'Para Track and Field', 'Para-Cycling', 'Para-Equestrian',
  'Para-Rowing', 'Paracanoe', 'Paratriathlon', 'Racquetball', 'Rifle Shooting',
  'Rugby', 'Sailing', 'Shooting', 'Short Track Speedskating', 'Sitting Volleyball',
  'Skateboarding', 'Soccer', 'Soccer 7-A-Side', 'Softball', 'Sport Climbing',
  'Squash', 'Surfing', 'Swimming', 'Table Tennis', 'Taekwondo', 'Team Handball',
  'Tennis', 'Track and Field', 'Triathlon', 'Volleyball', 'Water Polo',
  'Waterski/Wakeboard', 'Weightlifting', 'Wheelchair Basketball',
  'Wheelchair Fencing', 'Wheelchair Rugby', 'Wheelchair Tennis', 'Wrestling',
]

const WINTER_SPORTS = [
  'Alpine Skiing', 'Biathlon', 'Bobsled', 'Cross-Country Skiing', 'Curling',
  'Figure Skating', 'Freestyle Skiing', 'Ice Hockey', 'Luge', 'Nordic Combined',
  'Para Alpine Skiing', 'Para Biathlon', 'Para Nordic Skiing', 'Para Snowboarding',
  'Rowing', 'Skeleton', 'Ski Jumping', 'Ski Mountaineering', 'Sled Hockey',
  'Snowboarding', 'Speedskating', 'Wheelchair Curling',
]

function SportCheckbox({ sport, checked, onChange }: { sport: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-1.5 py-[3px] w-full text-left"
    >
      <span
        className="flex-shrink-0 w-3.5 h-3.5 rounded-sm border"
        style={{
          backgroundColor: checked ? '#0284c7' : '#334155',
          borderColor: checked ? '#0284c7' : '#475569',
        }}
      />
      <span className="text-[#e2e8f0] text-xs truncate">{sport}</span>
    </button>
  )
}

export default function MapWithFilter({ cities, onContentPage }: { cities: City[]; onContentPage?: () => void }) {
  const [selectedState, setSelectedState] = useState('')
  const [gameFilter, setGameFilter] = useState(new Set(['Olympian', 'Paralympian']))
  const [seasonFilter, setSeasonFilter] = useState(new Set(['Summer', 'Winter']))
  const [medalFilter, setMedalFilter] = useState(new Set(['gold', 'silver', 'bronze', 'noMedal']))
  const [sportFilter, setSportFilter] = useState(new Set<string>())
  const [pendingSports, setPendingSports] = useState(new Set<string>())
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

  function toggleMedal(type: string) {
    setMedalFilter(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function openSportPanel() {
    setPendingSports(new Set(sportFilter))
    setSportOpen(true)
  }

  function closeSportPanel() {
    setSportOpen(false)
  }

  function applyAndClose() {
    setSportFilter(new Set(pendingSports))
    setSportOpen(false)
  }

  function togglePending(sport: string) {
    setPendingSports(prev => {
      const next = new Set(prev)
      next.has(sport) ? next.delete(sport) : next.add(sport)
      return next
    })
  }

  useEffect(() => {
    if (!sportOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setSportOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sportOpen])

  const sportLabel =
    sportFilter.size === 0 ? 'All Disciplines'
    : sportFilter.size === 1 ? [...sportFilter][0]
    : `${sportFilter.size} Disciplines`

  const filtered = (selectedState ? cities.filter(c => c.state === selectedState) : cities)
    .map(city => ({
      ...city,
      athletes: city.athletes.filter(a => {
        const gameMatch = gameFilter.size === 0 || gameFilter.size === 2 || gameFilter.has(a.olympic_paralympic)
        const seasonMatch = seasonFilter.size === 0 || seasonFilter.size === 2 || a.seasons.some(s => seasonFilter.has(s))
        const isNoMedal = a.medals.gold === 0 && a.medals.silver === 0 && a.medals.bronze === 0
        const medalMatch =
          (medalFilter.has('gold')    || a.medals.gold === 0) &&
          (medalFilter.has('silver')  || a.medals.silver === 0) &&
          (medalFilter.has('bronze')  || a.medals.bronze === 0) &&
          (medalFilter.has('noMedal') || !isNoMedal)
        const sportMatch = sportFilter.size === 0 || a.sports.some(s => sportFilter.has(s))
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
            <button
              onClick={() => toggleMedal('noMedal')}
              className={`w-12 h-12 rounded-full border-2 bg-[#1e293b] flex items-center justify-center transition-all
                ${medalFilter.has('noMedal') ? 'border-[#06B6D4] opacity-100' : 'border-[#475569] opacity-55'}`}
            >
              <span className="text-[#E2E8F0] text-xl font-semibold">Ø</span>
            </button>
          </div>
        </div>

        {/* Sport Disciplines panel */}
        <div ref={dropdownRef} className="relative flex items-center gap-2">
          <span className="text-sm text-[#71717A]" style={{ fontFamily: "'Geist', sans-serif" }}>Sport</span>
          <button
            onClick={openSportPanel}
            className="flex items-center gap-1 h-[30px] bg-[#1A1A1A] rounded px-2 cursor-pointer"
          >
            <span className="text-[#f1f5f9] text-sm">{sportLabel}</span>
            <span className="text-[#71717A] text-xs">▾</span>
          </button>

          {sportOpen && (
            <div
              className="absolute top-full mt-2 left-0 z-50 flex flex-col rounded-xl overflow-hidden"
              style={{ width: 340, backgroundColor: '#1e293b' }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid #334155' }}
              >
                <span className="text-[#f1f5f9] text-sm font-semibold">Sport Disciplines</span>
                <button
                  onClick={closeSportPanel}
                  className="flex items-center justify-center w-6 h-6 rounded-md text-[#94a3b8] text-xs hover:bg-[#475569] transition-colors"
                  style={{ backgroundColor: '#334155' }}
                >
                  ✕
                </button>
              </div>

              {/* Content area */}
              <div className="overflow-y-auto flex-1" style={{ maxHeight: 420 }}>
                <div className="flex flex-col gap-0.5 px-3 py-2">
                  {/* Summer section */}
                  <div className="flex items-center gap-1.5 pt-1 pb-2">
                    <span className="text-[#f59e0b] text-sm font-semibold">☀</span>
                    <span className="text-[#f59e0b] text-[11px] font-semibold tracking-wide">SUMMER</span>
                    <div className="flex-1 h-px bg-[#334155]" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    {SUMMER_SPORTS.map(sport => (
                      <SportCheckbox
                        key={sport}
                        sport={sport}
                        checked={pendingSports.has(sport)}
                        onChange={() => togglePending(sport)}
                      />
                    ))}
                  </div>

                  {/* Winter section */}
                  <div className="flex items-center gap-1.5 pt-3 pb-2">
                    <span className="text-[#7dd3fc] text-sm font-semibold">❄</span>
                    <span className="text-[#7dd3fc] text-[11px] font-semibold tracking-wide">WINTER</span>
                    <div className="flex-1 h-px bg-[#334155]" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    {WINTER_SPORTS.map(sport => (
                      <SportCheckbox
                        key={sport}
                        sport={sport}
                        checked={pendingSports.has(sport)}
                        onChange={() => togglePending(sport)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
                style={{ borderTop: '1px solid #334155' }}
              >
                <button
                  onClick={() => setPendingSports(new Set())}
                  className="flex-1 h-8 rounded-lg text-[#94a3b8] text-sm flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#334155' }}
                >
                  Clear All
                </button>
                <button
                  onClick={applyAndClose}
                  className="flex-1 h-8 rounded-lg text-white text-sm font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#0284c7' }}
                >
                  Apply
                </button>
              </div>
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
