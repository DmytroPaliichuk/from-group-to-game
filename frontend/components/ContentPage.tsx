'use client'

import type { FlatAthlete } from './MapWithFilter'
import AthleteCard from './AthleteCard'

export default function ContentPage({
  onMapPage,
  athletes,
}: {
  onMapPage: () => void
  athletes: FlatAthlete[]
}) {
  return (
    <div className="w-full h-full bg-[#0f172a] rounded-lg border border-[#1A1A1A] p-4 flex flex-col gap-3">
      <div className="flex items-center h-[52px]">
        <button
          onClick={onMapPage}
          className="h-12 bg-[#0B9FEA] hover:bg-[#0a8fd4] text-white text-sm font-medium px-6 rounded-full transition-colors"
        >
          &lt;&lt; Map Page
        </button>
      </div>

      {athletes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#71717A] text-sm">No athletes match the current filters.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {athletes.map((a, i) => (
              <AthleteCard key={i} athlete={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
