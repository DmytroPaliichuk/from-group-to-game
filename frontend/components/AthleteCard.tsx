'use client'

import { useState } from 'react'
import DOMPurify from 'dompurify'
import type { FlatAthlete } from './MapWithFilter'

const MEDAL_CHIPS: Record<string, { bg: string; text: string }> = {
  gold:   { bg: '#FFD166', text: '#3d2a00' },
  silver: { bg: '#D9DFE4', text: '#1a2330' },
  bronze: { bg: '#D78F5E', text: '#2a1400' },
}

function MedalChip({ kind, count }: { kind: 'gold' | 'silver' | 'bronze'; count: number }) {
  if (count === 0) return null
  const c = MEDAL_CHIPS[kind]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: c.bg,
      color: c.text,
      padding: '2px 7px',
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 700,
      minWidth: 24,
    }}>
      {count}
    </span>
  )
}

function AvatarImg({ athlete }: { athlete: FlatAthlete }) {
  const [imgError, setImgError] = useState(false)
  const showImage = athlete.thumbnail && !imgError
  const hue = ((athlete.first_name.charCodeAt(0) * 31) + (athlete.last_name.charCodeAt(0) * 7)) % 360
  const initials = `${athlete.first_name[0] ?? ''}${athlete.last_name[0] ?? ''}`.toUpperCase()

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={athlete.thumbnail}
        alt={`${athlete.first_name} ${athlete.last_name}`}
        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 16, flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div style={{
      width: 120,
      height: 120,
      borderRadius: 16,
      background: `linear-gradient(135deg, hsl(${hue} 50% 70%), hsl(${(hue + 40) % 360} 55% 55%))`,
      color: '#fff',
      fontFamily: 'Inter',
      fontWeight: 800,
      fontSize: 43,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function AthleteCard({ athlete }: { athlete: FlatAthlete }) {
  const [bioExpanded, setBioExpanded] = useState(false)

  const totalMedals = athlete.medals.gold + athlete.medals.silver + athlete.medals.bronze
  const birthYear = athlete.birthday ? new Date(athlete.birthday).getFullYear() : null
  const cleanBio = athlete.biography ? DOMPurify.sanitize(athlete.biography) : null

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      padding: 22,
      boxShadow: 'rgba(14,15,12,0.10) 0 0 0 1px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Top: avatar + identity + medals */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <AvatarImg athlete={athlete} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 19, color: '#0e0f0c' }}>
            {athlete.first_name} {athlete.last_name}
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: '#454745', marginTop: 3 }}>
            {athlete.city}, {athlete.state}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {athlete.sports[0] && (
              <span style={{
                background: '#e2f6d5',
                color: '#163300',
                padding: '3px 9px',
                borderRadius: 9999,
                fontFamily: 'Inter',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {athlete.sports[0]}
              </span>
            )}
            {birthYear && (
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#868685', fontWeight: 600 }}>
                Born {birthYear}
              </span>
            )}
          </div>
        </div>

        {/* Medal chips top-right */}
        {totalMedals > 0 && (
          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
            <MedalChip kind="gold"   count={athlete.medals.gold} />
            <MedalChip kind="silver" count={athlete.medals.silver} />
            <MedalChip kind="bronze" count={athlete.medals.bronze} />
          </div>
        )}
      </div>

      {/* Fun fact */}
      {athlete.fun_fact && (
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#454745', fontStyle: 'italic', margin: 0 }}>
          {athlete.fun_fact}
        </p>
      )}

      {/* Biography with expand/collapse */}
      {cleanBio && (
        <div>
          <div
            className={`[&_h5]:font-semibold [&_h5]:text-[#0e0f0c] [&_h5]:mt-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mt-0.5 ${bioExpanded ? '' : 'max-h-[4.5rem] overflow-hidden'}`}
            style={{ fontFamily: 'Inter', fontSize: 12, color: '#454745' }}
            dangerouslySetInnerHTML={{ __html: cleanBio }}
          />
          <button
            onClick={() => setBioExpanded(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#163300',
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: 12,
              padding: 0,
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {bioExpanded ? 'Show less ▲' : 'Read more ▼'}
          </button>
        </div>
      )}
    </div>
  )
}
