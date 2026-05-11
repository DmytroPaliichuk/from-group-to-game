'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import Chat from '@/components/Chat'
import MapContentSlider from '@/components/MapContentSlider'
import TopBar from '@/components/TopBar'
import SportModal from '@/components/SportModal'
import AthleteSearch, { AthleteEntry } from '@/components/AthleteSearch'
import CitySearch, { CityEntry, STATE_NAMES } from '@/components/CitySearch'

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

function mapMedalValue(v: string): string {
  if (v === 'No Medal') return 'noMedal'
  return v.toLowerCase()
}

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

  // Filter state
  const [showContent,          setShowContent]          = useState(false)
  const [selectedState,        setSelectedState]        = useState('')
  const [gameFilter,           setGameFilter]           = useState(new Set(['Olympian', 'Paralympian']))
  const [seasonFilter,         setSeasonFilter]         = useState(new Set(['Summer', 'Winter']))
  const [medalFilter,          setMedalFilter]          = useState(new Set(['gold', 'silver', 'bronze', 'noMedal']))
  const [sportFilter,          setSportFilter]          = useState(new Set<string>())
  const [selectedAthleteIds,   setSelectedAthleteIds]   = useState(new Set<number>())
  const [selectedAthleteNames, setSelectedAthleteNames] = useState(new Set<string>())
  const [selectedCityKeys,     setSelectedCityKeys]     = useState(new Set<string>())
  const [searchClearSignal,    setSearchClearSignal]    = useState(0)

  // Sport modal state
  const [sportOpen,    setSportOpen]    = useState(false)
  const [pendingSports, setPendingSports] = useState(new Set<string>())

  // Flat lists for search components (lifted from MapWithFilter)
  const allAthletes = useMemo<AthleteEntry[]>(() => {
    const entries: AthleteEntry[] = []
    let id = 0
    for (const city of cities) {
      for (const a of city.athletes) {
        entries.push({
          id: id++,
          firstName: a.first_name,
          lastName: a.last_name,
          fullName: `${a.first_name} ${a.last_name}`,
          city: city.city,
          state: city.state,
        })
      }
    }
    return entries
  }, [cities])

  const allCities = useMemo<CityEntry[]>(() => {
    const seen = new Set<string>()
    const entries: CityEntry[] = []
    for (const c of cities) {
      const key = `${c.city}|${c.state}`
      if (!seen.has(key)) {
        seen.add(key)
        entries.push({
          key,
          city: c.city,
          state: c.state,
          label: `${STATE_NAMES[c.state] ?? c.state} — ${c.city}`,
        })
      }
    }
    return entries
  }, [cities])

  // Athlete filter handlers
  function handleAthleteSelect(id: number) {
    setSelectedAthleteIds(prev => new Set([...prev, id]))
  }
  function handleAthleteRemove(id: number) {
    setSelectedAthleteIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  function handleCitySelect(key: string) {
    setSelectedCityKeys(prev => new Set([...prev, key]))
  }
  function handleCityRemove(key: string) {
    setSelectedCityKeys(prev => { const n = new Set(prev); n.delete(key); return n })
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

  // Sport modal handlers
  function openSportModal() {
    setPendingSports(new Set(sportFilter))
    setSportOpen(true)
  }
  function closeSportModal() { setSportOpen(false) }
  function applyAndClose() {
    setSportFilter(new Set(pendingSports))
    setSportOpen(false)
  }
  function togglePendingSport(sport: string) {
    setPendingSports(prev => {
      const n = new Set(prev)
      n.has(sport) ? n.delete(sport) : n.add(sport)
      return n
    })
  }
  function clearPendingSports() { setPendingSports(new Set()) }

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

  void applyPreset // available but not currently triggered from UI

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

  // Drag-to-resize separator
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
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: '#fafaf7',
    }}>
      {/* Top bar — spans full width */}
      <TopBar
        showContent={showContent}
        onToggleContent={() => setShowContent(v => !v)}
        gameFilter={gameFilter}
        onGameFilter={setGameFilter}
        seasonFilter={seasonFilter}
        onSeasonFilter={setSeasonFilter}
        medalFilter={medalFilter}
        onMedalFilter={setMedalFilter}
        sportFilter={sportFilter}
        onOpenSportModal={openSportModal}
        onClearAll={handleClearAllFilters}
      />

      {/* Search row — spans full width */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid rgba(14,15,12,0.10)',
        padding: '14px 32px',
        display: 'flex',
        gap: 16,
        flexShrink: 0,
      }}>
        <AthleteSearch
          className="flex-1 min-w-0"
          athletes={allAthletes}
          selectedIds={selectedAthleteIds}
          onSelect={handleAthleteSelect}
          onRemove={handleAthleteRemove}
          clearSignal={searchClearSignal}
        />
        <CitySearch
          className="flex-1 min-w-0"
          cities={allCities}
          selectedKeys={selectedCityKeys}
          onSelect={handleCitySelect}
          onRemove={handleCityRemove}
          clearSignal={searchClearSignal}
        />
      </div>

      {/* Map + Chat row */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        padding: '24px 0 24px 32px',
        minHeight: 0,
      }}>
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
          searchClearSignal={searchClearSignal}
        />

        {/* Drag separator */}
        <div
          onMouseDown={onSeparatorMouseDown}
          style={{
            position: 'relative',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            cursor: 'col-resize',
          }}
          aria-hidden="true"
        >
          <div style={{ width: 4, height: '100%', borderRadius: 2, background: 'rgba(14,15,12,0.10)' }} />
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(14,15,12,0.20)' }} />
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div style={{ width: chatWidth, flexShrink: 0, height: '100%', paddingRight: 32 }}>
          <Chat onApplyFilters={applyAgentFilters} />
        </div>
      </div>

      {/* Sport modal — full-screen overlay */}
      <SportModal
        open={sportOpen}
        pendingSports={pendingSports}
        onToggle={togglePendingSport}
        onApply={applyAndClose}
        onCancel={closeSportModal}
        onClearAll={clearPendingSports}
      />
    </main>
  )
}
