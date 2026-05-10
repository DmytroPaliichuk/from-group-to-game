'use client'

import { useState } from 'react'
import Image from 'next/image'
import DOMPurify from 'dompurify'
import type { FlatAthlete } from './MapWithFilter'

const MEDAL_DEFS = [
  { key: 'gold',   icon: '🥇', count: (m: FlatAthlete['medals']) => m.gold },
  { key: 'silver', icon: '🥈', count: (m: FlatAthlete['medals']) => m.silver },
  { key: 'bronze', icon: '🥉', count: (m: FlatAthlete['medals']) => m.bronze },
] as const

function formatBirthday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AthleteCard({ athlete }: { athlete: FlatAthlete }) {
  const [imgError, setImgError] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)

  const showImage = athlete.thumbnail && !imgError
  const initials =
    (athlete.first_name[0] ?? '').toUpperCase() +
    (athlete.last_name[0] ?? '').toUpperCase()

  const medals = MEDAL_DEFS
    .map(d => ({ key: d.key, icon: d.icon, count: d.count(athlete.medals) }))
    .filter(m => m.count > 0)

  const cleanBio = athlete.biography ? DOMPurify.sanitize(athlete.biography) : null

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex flex-col gap-3">

      {/* Top section: photo + identity */}
      <div className="flex gap-3">

        {/* Photo or initials placeholder */}
        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#0f172a] flex items-center justify-center">
          {showImage ? (
            <Image
              src={athlete.thumbnail}
              alt={`${athlete.first_name} ${athlete.last_name}`}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-xl font-semibold text-slate-400">{initials}</span>
          )}
        </div>

        {/* Identity fields */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-slate-100 font-semibold text-sm leading-tight">
            {athlete.first_name} {athlete.last_name}
          </p>
          <p className="text-slate-300 text-sm">{athlete.city}, {athlete.state}</p>
          {athlete.birthday && (
            <p className="text-slate-400 text-xs">{formatBirthday(athlete.birthday)}</p>
          )}
          {athlete.education && (
            <p className="text-slate-400 text-xs">{athlete.education}</p>
          )}
          {athlete.sports.length > 0 && (
            <p className="text-slate-400 text-xs">{athlete.sports.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Medals — only rendered when at least one non-zero */}
      {medals.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {medals.map(m => (
            <span key={m.key} className="text-xs text-slate-100">
              {m.icon} {m.count}
            </span>
          ))}
        </div>
      )}

      {/* Fun fact — only rendered when present */}
      {athlete.fun_fact && (
        <p className="text-slate-300 text-sm italic">{athlete.fun_fact}</p>
      )}

      {/* Biography — sanitized HTML, collapsed by default */}
      {cleanBio && (
        <div>
          <div
            className={`text-slate-300 text-xs [&_h5]:font-semibold [&_h5]:text-slate-200 [&_h5]:mt-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mt-0.5 ${bioExpanded ? '' : 'max-h-[4.5rem] overflow-hidden'}`}
            dangerouslySetInnerHTML={{ __html: cleanBio }}
          />
          <button
            onClick={() => setBioExpanded(prev => !prev)}
            className="text-sky-400 text-xs mt-1 hover:text-sky-300 transition-colors"
          >
            {bioExpanded ? 'Show less ▲' : 'Read more ▼'}
          </button>
        </div>
      )}
    </div>
  )
}
