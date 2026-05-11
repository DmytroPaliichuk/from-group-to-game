'use client'

import { useState } from 'react'

interface AthleteData {
  first_name: string
  last_name: string
  olympic_paralympic: string
  seasons: string[]
  medals: { gold: number; silver: number; bronze: number }
  sports: string[]
  thumbnail: string
}

interface CityTooltipProps {
  x: number
  y: number
  city: string
  state?: string
  athletes: AthleteData[]
}

const POPUP_WIDTH = 280
const POPUP_MAX_HEIGHT = 360

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

function AthleteAvatar({ thumbnail, firstName, lastName }: { thumbnail: string; firstName: string; lastName: string }) {
  const [imgError, setImgError] = useState(false)
  const hue = ((firstName.charCodeAt(0) * 31) + (lastName.charCodeAt(0) * 7)) % 360
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  if (thumbnail && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnail}
        alt={`${firstName} ${lastName}`}
        width={40}
        height={40}
        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: `linear-gradient(135deg, hsl(${hue} 50% 70%), hsl(${(hue + 40) % 360} 55% 55%))`,
      color: '#fff',
      fontFamily: 'Inter',
      fontWeight: 800,
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function CityTooltip({ x, y, city, state, athletes }: CityTooltipProps) {
  const left =
    x + 16 + POPUP_WIDTH > (typeof window !== 'undefined' ? window.innerWidth : 9999)
      ? x - POPUP_WIDTH - 8
      : x + 16

  const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 9999) - POPUP_MAX_HEIGHT - 16
  const top = Math.min(y - 20, maxTop)

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 50,
        width: POPUP_WIDTH,
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: 'rgba(14,15,12,0.20) 0 0 0 1px, rgba(14,15,12,0.10) 0 12px 32px',
        fontFamily: 'Inter',
        pointerEvents: 'none',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontFamily: '"Archivo Black"', fontSize: 22, color: '#0e0f0c', lineHeight: 0.9 }}>
            {city}
          </div>
          {state && (
            <div style={{ fontSize: 11, color: '#868685', fontWeight: 600, marginTop: 3 }}>
              {state} · {athletes.length} athlete{athletes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <span style={{
          background: '#e2f6d5',
          color: '#163300',
          padding: '3px 8px',
          borderRadius: 9999,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.5,
          flexShrink: 0,
        }}>
          HOMETOWN
        </span>
      </div>

      {/* Athlete rows */}
      <div style={{ overflowY: 'auto', maxHeight: POPUP_MAX_HEIGHT - 80 }}>
        {athletes.map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 18px',
              borderTop: i > 0 ? '1px solid rgba(14,15,12,0.08)' : 'none',
            }}
          >
            <AthleteAvatar thumbnail={a.thumbnail} firstName={a.first_name} lastName={a.last_name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0e0f0c' }}>
                {a.first_name} {a.last_name}
              </div>
              {a.sports[0] && (
                <div style={{ fontSize: 11, fontWeight: 500, color: '#454745', marginTop: 1 }}>
                  {a.sports[0]}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              <MedalChip kind="gold"   count={a.medals.gold} />
              <MedalChip kind="silver" count={a.medals.silver} />
              <MedalChip kind="bronze" count={a.medals.bronze} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
