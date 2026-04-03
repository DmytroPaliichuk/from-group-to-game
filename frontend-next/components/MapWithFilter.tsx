'use client'

import { useState } from 'react'
import UsMap from './UsMap'

interface City {
  city: string
  state: string
  lat: number
  lng: number
}

export default function MapWithFilter({ cities }: { cities: City[] }) {
  const [selectedState, setSelectedState] = useState('')

  const states = [...new Set(cities.map(c => c.state))].sort()
  const filtered = selectedState ? cities.filter(c => c.state === selectedState) : cities

  return (
    <div className="w-full h-full flex flex-col bg-slate-800 rounded-2xl p-4 overflow-hidden">
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
      <UsMap cities={filtered} selectedState={selectedState || undefined} />
    </div>
  )
}
