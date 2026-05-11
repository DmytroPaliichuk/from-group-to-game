'use client'

import { useState, useEffect } from 'react'
import MapWithFilter, { FlatAthlete } from './MapWithFilter'
import ContentPage from './ContentPage'

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

interface MapContentSliderProps {
  cities: City[]
  showContent: boolean
  onShowContent: (v: boolean) => void
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
}

export default function MapContentSlider({
  cities,
  showContent,
  onShowContent,
  selectedState,
  onStateSelect,
  gameFilter,
  onGameFilter,
  seasonFilter,
  onSeasonFilter,
  medalFilter,
  onMedalFilter,
  sportFilter,
  onSportFilter,
  selectedAthleteIds,
  onAthleteSelect,
  onAthleteRemove,
  selectedAthleteNames = new Set<string>(),
  selectedCityKeys,
  onCitySelect,
  onCityRemove,
  searchClearSignal,
}: MapContentSliderProps) {
  const [filteredAthletes, setFilteredAthletes] = useState<FlatAthlete[]>([])
  const [clickedCity, setClickedCity] = useState<{ city: string; state: string } | null>(null)

  useEffect(() => {
    if (!showContent) setClickedCity(null)
  }, [showContent])

  function handleCityDotClick(city: string, state: string) {
    setClickedCity({ city, state })
    onShowContent(true)
  }

  const contentAthletes = clickedCity
    ? filteredAthletes.filter(a => a.city === clickedCity.city && a.state === clickedCity.state)
    : filteredAthletes

  return (
    <div className="flex-1 min-w-0 h-full overflow-hidden">
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{
          width: '200%',
          transform: showContent ? 'translateX(-50%)' : 'translateX(0)',
        }}
      >
        <div className="h-full" style={{ width: '50%' }}>
          <MapWithFilter
            cities={cities}
            onFilteredChange={setFilteredAthletes}
            selectedState={selectedState}
            onStateSelect={onStateSelect}
            gameFilter={gameFilter}
            onGameFilter={onGameFilter}
            seasonFilter={seasonFilter}
            onSeasonFilter={onSeasonFilter}
            medalFilter={medalFilter}
            onMedalFilter={onMedalFilter}
            sportFilter={sportFilter}
            onSportFilter={onSportFilter}
            selectedAthleteIds={selectedAthleteIds}
            onAthleteSelect={onAthleteSelect}
            onAthleteRemove={onAthleteRemove}
            selectedAthleteNames={selectedAthleteNames}
            selectedCityKeys={selectedCityKeys}
            onCitySelect={onCitySelect}
            onCityRemove={onCityRemove}
            searchClearSignal={searchClearSignal}
            onCityDotClick={handleCityDotClick}
          />
        </div>
        <div className="h-full" style={{ width: '50%' }}>
          <ContentPage
            athletes={showContent ? contentAthletes : []}
          />
        </div>
      </div>
    </div>
  )
}
