'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import UsMap from './UsMap'
import type { AthleteEntry } from './AthleteSearch'
import topStateCities from '@/public/topStateSities.json'

export interface FlatAthlete {
  first_name: string
  last_name: string
  city: string
  state: string
  sports: string[]
  medals: { gold: number; silver: number; bronze: number }
  thumbnail: string
  birthday: string | null
  education: string | null
  fun_fact: string | null
  biography: string | null
}

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
    thumbnail: string
    birthday: string | null
    education: string | null
    fun_fact: string | null
    biography: string | null
  }[]
}

export default function MapWithFilter({
  cities,
  onFilteredChange,
  selectedState,
  onStateSelect,
  gameFilter,
  onGameFilter: _onGameFilter,
  seasonFilter,
  onSeasonFilter: _onSeasonFilter,
  medalFilter,
  onMedalFilter: _onMedalFilter,
  sportFilter,
  onSportFilter: _onSportFilter,
  selectedAthleteIds,
  onAthleteSelect: _onAthleteSelect,
  onAthleteRemove: _onAthleteRemove,
  selectedAthleteNames,
  selectedCityKeys,
  onCitySelect: _onCitySelect,
  onCityRemove: _onCityRemove,
  searchClearSignal: _searchClearSignal,
  onCityDotClick,
}: {
  cities: City[]
  onFilteredChange?: (athletes: FlatAthlete[]) => void
  selectedState: string
  onStateSelect: (s: string) => void
  gameFilter: Set<string>
  onGameFilter: (s: Set<string>) => void
  seasonFilter: Set<string>
  onSeasonFilter: (s: Set<string>) => void
  medalFilter: Set<string>
  onMedalFilter: (s: Set<string>) => void
  sportFilter: Set<string>
  onSportFilter: (s: Set<string>) => void
  selectedAthleteIds: Set<number>
  onAthleteSelect: (id: number) => void
  onAthleteRemove: (id: number) => void
  selectedAthleteNames?: Set<string>
  selectedCityKeys: Set<string>
  onCitySelect: (key: string) => void
  onCityRemove: (key: string) => void
  searchClearSignal: number
  onCityDotClick?: (city: string, state: string) => void
}) {
  const [notification, setNotification] = useState<string | null>(null)
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Kept locally so selectedAthleteKeys can map IDs → composite keys for filtering.
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

  const selectedAthleteKeys = useMemo<Set<string> | null>(() => {
    const hasIds = selectedAthleteIds.size > 0
    const hasNames = selectedAthleteNames && selectedAthleteNames.size > 0
    if (!hasIds && !hasNames) return null
    const keys = new Set<string>()
    for (const id of selectedAthleteIds) {
      const e = allAthletes[id]
      if (e) keys.add(`${e.firstName}|${e.lastName}|${e.city}|${e.state}`)
    }
    if (hasNames) {
      for (const e of allAthletes) {
        if (selectedAthleteNames!.has(e.fullName)) {
          keys.add(`${e.firstName}|${e.lastName}|${e.city}|${e.state}`)
        }
      }
    }
    return keys
  }, [selectedAthleteIds, selectedAthleteNames, allAthletes])

  const filtered = useMemo(() =>
    (selectedState ? cities.filter(c => c.state === selectedState) : cities)
      .filter(c => selectedCityKeys.size === 0 || selectedCityKeys.has(`${c.city}|${c.state}`))
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
          const athleteMatch =
            selectedAthleteKeys === null ||
            selectedAthleteKeys.has(`${a.first_name}|${a.last_name}|${city.city}|${city.state}`)
          return gameMatch && seasonMatch && medalMatch && sportMatch && athleteMatch
        })
      }))
      .filter(c => c.athletes.length > 0),
    [cities, selectedState, selectedCityKeys, gameFilter, seasonFilter, medalFilter, sportFilter, selectedAthleteKeys]
  )

  useEffect(() => {
    if (!onFilteredChange) return
    onFilteredChange(
      filtered.flatMap(c =>
        c.athletes.map(a => ({
          first_name: a.first_name,
          last_name: a.last_name,
          city: c.city,
          state: c.state,
          sports: a.sports,
          medals: a.medals,
          thumbnail: a.thumbnail,
          birthday: a.birthday,
          education: a.education,
          fun_fact: a.fun_fact,
          biography: a.biography,
        }))
      )
    )
  }, [filtered]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCityDotClick(city: { city: string; state: string }) {
    const match = filtered.find(c => c.city === city.city && c.state === city.state)
    if (!match || match.athletes.length === 0) {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current)
      setNotification(`No athletes from ${city.city} match the current filters.`)
      notifTimerRef.current = setTimeout(() => setNotification(null), 2500)
      return
    }
    onCityDotClick?.(city.city, city.state)
  }

  const stateCities = selectedState ? (topStateCities[selectedState as keyof typeof topStateCities] ?? []) : []

  return (
    <div className="relative w-full h-full flex">
      <div style={{
        flex: 1,
        background: '#fff',
        borderRadius: 30,
        border: '1px solid rgba(14,15,12,0.10)',
        padding: 18,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <UsMap
          cities={filtered}
          selectedState={selectedState || undefined}
          stateCities={stateCities}
          onStateSelect={onStateSelect}
          onCityDotClick={handleCityDotClick}
        />
      </div>

      {notification && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          background: '#fff',
          border: '1px solid rgba(14,15,12,0.15)',
          color: '#0e0f0c',
          fontSize: 13,
          padding: '8px 18px',
          borderRadius: 9999,
          boxShadow: 'rgba(14,15,12,0.12) 0 0 0 1px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          {notification}
        </div>
      )}
    </div>
  )
}
