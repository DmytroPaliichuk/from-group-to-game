'use client'

import type { FlatAthlete } from './MapWithFilter'
import AthleteCard from './AthleteCard'

export default function ContentPage({
  athletes,
}: {
  athletes: FlatAthlete[]
}) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
      {athletes.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#868685', fontSize: 14, fontFamily: 'Inter' }}>
            No athletes match the current filters.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            {athletes.map((a, i) => (
              <AthleteCard key={i} athlete={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
