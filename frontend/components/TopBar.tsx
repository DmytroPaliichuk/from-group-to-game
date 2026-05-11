'use client'

import { Zap, Accessibility, Sun, Snowflake, ChevronDown } from 'lucide-react'

export interface TopBarProps {
  showContent: boolean
  onToggleContent: () => void
  gameFilter: Set<string>
  onGameFilter: (s: Set<string>) => void
  seasonFilter: Set<string>
  onSeasonFilter: (s: Set<string>) => void
  medalFilter: Set<string>
  onMedalFilter: (s: Set<string>) => void
  sportFilter: Set<string>
  onOpenSportModal: () => void
  onClearAll: () => void
}

const BORDER = '1px solid rgba(14,15,12,0.10)'

function toggle(set: Set<string>, key: string): Set<string> {
  const next = new Set(set)
  next.has(key) ? next.delete(key) : next.add(key)
  return next
}

function IconBtn({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: active ? '#e2f6d5' : '#ffffff',
        border: active ? '1.5px solid #163300' : BORDER,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

const MEDAL_COLORS: Record<string, { bg: string; text: string }> = {
  gold:    { bg: '#FFD166', text: '#3d2a00' },
  silver:  { bg: '#D9DFE4', text: '#1a2330' },
  bronze:  { bg: '#D78F5E', text: '#2a1400' },
  noMedal: { bg: '#ffffff', text: '#868685' },
}

function MedalPip({ kind, active, onClick }: { kind: string; active: boolean; onClick: () => void }) {
  const c = MEDAL_COLORS[kind]
  return (
    <button
      title={kind === 'noMedal' ? 'No medal' : kind.charAt(0).toUpperCase() + kind.slice(1)}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: c.bg,
        border: active ? '2px solid #163300' : BORDER,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: c.text,
        fontFamily: 'Inter',
        fontWeight: 800,
        fontSize: 10,
      }}
    >
      {kind === 'noMedal' ? 'Ø' : null}
    </button>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontFamily: 'Inter',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: '#868685',
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {children}
      </div>
    </div>
  )
}

export default function TopBar({
  showContent,
  onToggleContent,
  gameFilter,
  onGameFilter,
  seasonFilter,
  onSeasonFilter,
  medalFilter,
  onMedalFilter,
  sportFilter,
  onOpenSportModal,
  onClearAll,
}: TopBarProps) {
  const iconColor = (active: boolean) => active ? '#163300' : '#454745'
  const sportLabel = sportFilter.size === 0
    ? 'All disciplines'
    : `${sportFilter.size} sport${sportFilter.size === 1 ? '' : 's'}`

  return (
    <div style={{
      height: 72,
      background: '#ffffff',
      borderBottom: BORDER,
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      gap: 28,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: 28, height: 28 }}>
          <div style={{ width: 28, height: 28, background: '#0e0f0c', borderRadius: '50%' }} />
          <div style={{
            position: 'absolute', right: -2, top: -2,
            width: 10, height: 10,
            background: '#9fe870',
            borderRadius: '50%',
          }} />
        </div>
        <span style={{ fontFamily: '"Archivo Black"', fontSize: 22, color: '#0e0f0c', letterSpacing: -0.5 }}>
          OlymPick
        </span>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 32, background: 'rgba(14,15,12,0.10)', flexShrink: 0 }} />

      {/* Filter groups */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <FilterGroup label="Game">
          <IconBtn active={gameFilter.has('Olympian')} onClick={() => onGameFilter(toggle(gameFilter, 'Olympian'))} title="Olympic">
            <Zap size={16} color={iconColor(gameFilter.has('Olympian'))} />
          </IconBtn>
          <IconBtn active={gameFilter.has('Paralympian')} onClick={() => onGameFilter(toggle(gameFilter, 'Paralympian'))} title="Paralympic">
            <Accessibility size={16} color={iconColor(gameFilter.has('Paralympian'))} />
          </IconBtn>
        </FilterGroup>

        <FilterGroup label="Season">
          <IconBtn active={seasonFilter.has('Summer')} onClick={() => onSeasonFilter(toggle(seasonFilter, 'Summer'))} title="Summer">
            <Sun size={16} color={iconColor(seasonFilter.has('Summer'))} />
          </IconBtn>
          <IconBtn active={seasonFilter.has('Winter')} onClick={() => onSeasonFilter(toggle(seasonFilter, 'Winter'))} title="Winter">
            <Snowflake size={16} color={iconColor(seasonFilter.has('Winter'))} />
          </IconBtn>
        </FilterGroup>

        <FilterGroup label="Medals">
          {(['gold', 'silver', 'bronze', 'noMedal'] as const).map(kind => (
            <MedalPip
              key={kind}
              kind={kind}
              active={medalFilter.has(kind)}
              onClick={() => onMedalFilter(toggle(medalFilter, kind))}
            />
          ))}
        </FilterGroup>

        <FilterGroup label="Sport">
          <button
            onClick={onOpenSportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              border: BORDER,
              padding: '8px 14px',
              borderRadius: 10,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 13,
              color: '#0e0f0c',
              cursor: 'pointer',
            }}
          >
            {sportLabel}
            <ChevronDown size={14} color="#454745" />
          </button>
        </FilterGroup>
      </div>

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onClearAll}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 13,
            color: '#454745',
          }}
        >
          Clear filters
        </button>

        <button
          onClick={onToggleContent}
          style={{
            background: '#9fe870',
            color: '#163300',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 9999,
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {showContent ? '← Map page' : 'Content page →'}
        </button>
      </div>
    </div>
  )
}
