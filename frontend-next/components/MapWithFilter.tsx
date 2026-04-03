'use client'

import { useState } from 'react'
import UsMap from './UsMap'
import topStateCities from '@/public/topStateSities.json'

interface City {
  city: string
  state: string
  lat: number
  lng: number
}

export default function MapWithFilter({ cities, onContentPage }: { cities: City[]; onContentPage?: () => void }) {
  const [selectedState, setSelectedState] = useState('')

  const states = [...new Set(cities.map(c => c.state))].sort()
  const filtered = selectedState ? cities.filter(c => c.state === selectedState) : cities
  const stateCities = selectedState ? (topStateCities[selectedState as keyof typeof topStateCities] ?? []) : []

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-800 rounded-2xl p-4 overflow-hidden">
      {onContentPage && (
        <button
          onClick={onContentPage}
          className="absolute top-4 right-4 z-10 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm px-4 py-2 rounded-xl border border-slate-600 transition-colors"
        >
          Content Page &gt;&gt;
        </button>
      )}
      <div className="mb-3 flex items-center gap-2">
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
      <UsMap cities={filtered} selectedState={selectedState || undefined} stateCities={stateCities} />
    </div>
  )
}
