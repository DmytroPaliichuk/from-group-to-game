'use client'

import { useState } from 'react'
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
  }[]
}

export default function MapContentSlider({ cities }: { cities: City[] }) {
  const [showContent, setShowContent] = useState(false)
  const [filteredAthletes, setFilteredAthletes] = useState<FlatAthlete[]>([])

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
            onContentPage={() => setShowContent(true)}
            onFilteredChange={setFilteredAthletes}
          />
        </div>
        <div className="h-full" style={{ width: '50%' }}>
          <ContentPage
            athletes={showContent ? filteredAthletes : []}
            onMapPage={() => setShowContent(false)}
          />
        </div>
      </div>
    </div>
  )
}
