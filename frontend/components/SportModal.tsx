'use client'

import { X, Sun, Snowflake, Check } from 'lucide-react'
import { SUMMER_SPORTS, WINTER_SPORTS } from '@/lib/sports'

export interface SportModalProps {
  open: boolean
  pendingSports: Set<string>
  onToggle: (sport: string) => void
  onApply: () => void
  onCancel: () => void
  onClearAll: () => void
}

const BORDER = '1px solid rgba(14,15,12,0.10)'
const TOTAL = SUMMER_SPORTS.length + WINTER_SPORTS.length

function SportCheckbox({ sport, checked, onToggle }: { sport: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: checked ? '1.5px solid #163300' : '1.5px solid #868685',
        background: checked ? '#9fe870' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {checked && <Check size={12} color="#163300" strokeWidth={3} />}
      </span>
      <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: '#0e0f0c' }}>
        {sport}
      </span>
    </button>
  )
}

function SportSection({
  icon,
  label,
  color,
  sports,
  pendingSports,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  color: string
  sports: string[]
  pendingSports: Set<string>
  onToggle: (s: string) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {icon}
        <span style={{ fontFamily: '"Archivo Black"', fontSize: 18, color, letterSpacing: 0.5 }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(14,15,12,0.10)' }} />
      </div>
      <div style={{ columns: 3, columnGap: 24 }}>
        {sports.map(s => (
          <div key={s} style={{ breakInside: 'avoid' }}>
            <SportCheckbox sport={s} checked={pendingSports.has(s)} onToggle={() => onToggle(s)} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SportModal({ open, pendingSports, onToggle, onApply, onCancel, onClearAll }: SportModalProps) {
  if (!open) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(14,15,12,0.40)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{
        width: 880,
        maxHeight: '85vh',
        background: '#fff',
        borderRadius: 30,
        boxShadow: 'rgba(14,15,12,0.20) 0 0 0 1px, rgba(0,0,0,0.30) 0 24px 64px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: BORDER,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: '"Archivo Black"', fontSize: 28, color: '#0e0f0c', lineHeight: 0.9 }}>
              Pick your sports.
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: '#454745', fontWeight: 500, marginTop: 4 }}>
              {pendingSports.size} selected · {TOTAL} total disciplines
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: BORDER,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color="#0e0f0c" />
          </button>
        </div>

        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Visual-only search inputs */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: BORDER, borderRadius: 10, padding: '10px 14px' }}>
              <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: '#868685', letterSpacing: 1.2, textTransform: 'uppercase' }}>Athlete</span>
              <input placeholder="Search athletes…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: '#0e0f0c' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: BORDER, borderRadius: 10, padding: '10px 14px' }}>
              <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: '#868685', letterSpacing: 1.2, textTransform: 'uppercase' }}>City</span>
              <input placeholder="Search cities…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: '#0e0f0c' }} />
            </div>
          </div>

          <SportSection
            icon={<Sun size={18} color="#c97c1a" />}
            label="SUMMER"
            color="#c97c1a"
            sports={SUMMER_SPORTS}
            pendingSports={pendingSports}
            onToggle={onToggle}
          />
          <SportSection
            icon={<Snowflake size={18} color="#1a6cc9" />}
            label="WINTER"
            color="#1a6cc9"
            sports={WINTER_SPORTS}
            pendingSports={pendingSports}
            onToggle={onToggle}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 32px',
          borderTop: BORDER,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            onClick={onClearAll}
            style={{ background: 'transparent', border: 'none', fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#454745', cursor: 'pointer' }}
          >
            Clear all
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              style={{ background: '#fff', border: '1px solid rgba(14,15,12,0.10)', padding: '12px 20px', borderRadius: 9999, fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: '#0e0f0c', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              style={{ background: '#9fe870', color: '#163300', border: 'none', padding: '12px 24px', borderRadius: 9999, fontFamily: 'Inter', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Apply {pendingSports.size} filter{pendingSports.size === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
