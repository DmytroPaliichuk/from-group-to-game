'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Chat from '@/components/Chat'
import MapContentSlider from '@/components/MapContentSlider'

const CHAT_MIN = 200
const CHAT_MAX = 700
const CHAT_DEFAULT = 384

const LA_PRESET = {
  selectedState:      'CA',
  gameFilter:         new Set(['Olympian', 'Paralympian']),
  seasonFilter:       new Set(['Summer', 'Winter']),
  medalFilter:        new Set(['gold']),
  sportFilter:        new Set<string>(),
  selectedAthleteIds: new Set<number>(),
  selectedCityKeys:   new Set(['Los Angeles|CA']),
  showContent:        false,
}

// "Gold" → "gold", "No Medal" → "noMedal" (agent uses Title Case, component uses lowercase)
function mapMedalValue(v: string): string {
  if (v === 'No Medal') return 'noMedal'
  return v.toLowerCase()
}

// Resolve agent city names to the "City|STATE" keys used by selectedCityKeys.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCityKeys(cityNames: string[], cities: any[]): Set<string> {
  const lower = cityNames.map(n => n.toLowerCase())
  const keys = new Set<string>()
  for (const c of cities) {
    if (lower.includes((c.city ?? '').toLowerCase())) {
      keys.add(`${c.city}|${c.state}`)
    }
  }
  return keys
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ResizableLayout({ cities }: { cities: any[] }) {
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  // Filter state — owned here so both Chat and MapContentSlider can access it
  const [showContent,        setShowContent]        = useState(false)
  const [selectedState,      setSelectedState]      = useState('')
  const [gameFilter,         setGameFilter]         = useState(new Set(['Olympian', 'Paralympian']))
  const [seasonFilter,       setSeasonFilter]       = useState(new Set(['Summer', 'Winter']))
  const [medalFilter,        setMedalFilter]        = useState(new Set(['gold', 'silver', 'bronze', 'noMedal']))
  const [sportFilter,        setSportFilter]        = useState(new Set<string>())
  const [selectedAthleteIds,   setSelectedAthleteIds]   = useState(new Set<number>())
  const [selectedAthleteNames, setSelectedAthleteNames] = useState(new Set<string>())
  const [selectedCityKeys,     setSelectedCityKeys]     = useState(new Set<string>())
  const [searchClearSignal,  setSearchClearSignal]  = useState(0)

  function handleAthleteSelect(id: number) {
    setSelectedAthleteIds(prev => new Set([...prev, id]))
  }

  function handleAthleteRemove(id: number) {
    setSelectedAthleteIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleCitySelect(key: string) {
    setSelectedCityKeys(prev => new Set([...prev, key]))
  }

  function handleClearAllFilters() {
    setGameFilter(new Set(['Olympian', 'Paralympian']))
    setSeasonFilter(new Set(['Summer', 'Winter']))
    setMedalFilter(new Set(['gold', 'silver', 'bronze', 'noMedal']))
    setSportFilter(new Set<string>())
    setSelectedAthleteIds(new Set<number>())
    setSelectedAthleteNames(new Set<string>())
    setSelectedCityKeys(new Set<string>())
    setSearchClearSignal(prev => prev + 1)
  }

  function handleCityRemove(key: string) {
    setSelectedCityKeys(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  function applyPreset() {
    setSelectedState(LA_PRESET.selectedState)
    setGameFilter(new Set(LA_PRESET.gameFilter))
    setSeasonFilter(new Set(LA_PRESET.seasonFilter))
    setMedalFilter(new Set(LA_PRESET.medalFilter))
    setSportFilter(new Set(LA_PRESET.sportFilter))
    setSelectedAthleteIds(new Set(LA_PRESET.selectedAthleteIds))
    setSelectedCityKeys(new Set(LA_PRESET.selectedCityKeys))
    setShowContent(LA_PRESET.showContent)
  }

  function applyAgentFilters(filters: Record<string, string[]>) {
    if ('game'    in filters) setGameFilter(new Set(filters.game))
    if ('season'  in filters) setSeasonFilter(new Set(filters.season))
    if ('medal'   in filters) setMedalFilter(new Set(filters.medal.map(mapMedalValue)))
    if ('state'   in filters) setSelectedState(filters.state[0] ?? '')
    if ('sport'   in filters) setSportFilter(new Set(filters.sport))
    if ('athlete' in filters) {
      setSelectedAthleteNames(new Set(filters.athlete))
      setSelectedAthleteIds(new Set<number>())
    }
    if ('city' in filters) setSelectedCityKeys(buildCityKeys(filters.city, cities))
    setShowContent(false)
    setSearchClearSignal(prev => prev + 1)
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = startX.current - e.clientX
    const next = Math.min(CHAT_MAX, Math.max(CHAT_MIN, startWidth.current + delta))
    setChatWidth(next)
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const onSeparatorMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [chatWidth, onMouseMove, onMouseUp])

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  return (
    <main
      className="flex flex-row h-screen overflow-hidden p-4"
      style={{
        background: `
          radial-gradient(ellipse 140% 140% at 25% 35%, rgba(168,85,247,0.15) 0%, transparent 100%),
          radial-gradient(ellipse 120% 120% at 75% 65%, rgba(236,72,153,0.10) 0%, transparent 100%),
          radial-gradient(ellipse 80% 80% at 55% 15%, rgba(6,182,212,0.08) 0%, transparent 100%),
          #020617
        `,
      }}
    >
      <MapContentSlider
        cities={cities}
        showContent={showContent}
        onShowContent={setShowContent}
        selectedState={selectedState}
        onStateSelect={setSelectedState}
        gameFilter={gameFilter}
        onGameFilter={setGameFilter}
        seasonFilter={seasonFilter}
        onSeasonFilter={setSeasonFilter}
        medalFilter={medalFilter}
        onMedalFilter={setMedalFilter}
        sportFilter={sportFilter}
        onSportFilter={setSportFilter}
        selectedAthleteIds={selectedAthleteIds}
        onAthleteSelect={handleAthleteSelect}
        onAthleteRemove={handleAthleteRemove}
        selectedAthleteNames={selectedAthleteNames}
        selectedCityKeys={selectedCityKeys}
        onCitySelect={handleCitySelect}
        onCityRemove={handleCityRemove}
        onClearAllFilters={handleClearAllFilters}
        searchClearSignal={searchClearSignal}
      />

      <div
        onMouseDown={onSeparatorMouseDown}
        className="relative flex-shrink-0 flex items-center justify-center w-3 cursor-col-resize group"
        aria-hidden="true"
      >
        <div className="w-0.5 h-full rounded-full bg-[#334155] group-hover:bg-slate-500 transition-colors" />
        <div className="absolute flex flex-col gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#475569] group-hover:bg-slate-400 transition-colors" />
          ))}
        </div>
      </div>

      <div style={{ width: chatWidth }} className="flex-shrink-0 h-full">
        <Chat onApplyPreset={applyPreset} onApplyFilters={applyAgentFilters} />
      </div>
    </main>
  )
}
