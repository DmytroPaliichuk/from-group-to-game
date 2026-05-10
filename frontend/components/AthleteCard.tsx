'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { FlatAthlete } from './MapWithFilter'

const MEDAL_DEFS = [
  { key: 'gold',   icon: '🥇', count: (m: FlatAthlete['medals']) => m.gold },
  { key: 'silver', icon: '🥈', count: (m: FlatAthlete['medals']) => m.silver },
  { key: 'bronze', icon: '🥉', count: (m: FlatAthlete['medals']) => m.bronze },
] as const

export default function AthleteCard({ athlete }: { athlete: FlatAthlete }) {
  const [imgError, setImgError] = useState(false)
  const showImage = athlete.thumbnail && !imgError
  const initials =
    (athlete.first_name[0] ?? '').toUpperCase() +
    (athlete.last_name[0] ?? '').toUpperCase()

  const medals = MEDAL_DEFS.map(d => ({ key: d.key, icon: d.icon, count: d.count(athlete.medals) }))
    .filter(m => m.count > 0)

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-3 flex flex-col gap-2">
      {/* Photo or initials */}
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#0f172a] flex items-center justify-center">
        {showImage ? (
          <Image
            src={athlete.thumbnail}
            alt={`${athlete.first_name} ${athlete.last_name}`}
            width={200}
            height={200}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="text-2xl font-semibold text-[#94a3b8]"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Name */}
      <p
        className="text-[#e2e8f0] font-medium text-sm leading-tight"
        style={{ fontFamily: "'Geist', sans-serif" }}
      >
        {athlete.first_name} {athlete.last_name}
      </p>

      {/* City */}
      <p className="text-[#94a3b8] text-xs">{athlete.city}</p>

      {/* Sports */}
      <p className="text-[#94a3b8] text-xs leading-tight">{athlete.sports.join(', ')}</p>

      {/* Medals */}
      {medals.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {medals.map(m => (
            <span key={m.key} className="text-xs text-[#e2e8f0]">
              {m.icon} {m.count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
