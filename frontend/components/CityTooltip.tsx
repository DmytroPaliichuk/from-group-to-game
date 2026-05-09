'use client'

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
  athletes: AthleteData[]
}

const POPUP_WIDTH = 260
const POPUP_MAX_HEIGHT = 300

const MEDAL_COLORS = {
  gold: '#facc15',
  silver: '#cbd5e1',
  bronze: '#b45309',
} as const

function MedalCount({ color, count }: { color: string; count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <span className="inline-block rounded-full flex-shrink-0" style={{ width: 12, height: 12, backgroundColor: color }} />
      <span className="text-slate-300">{count}</span>
    </span>
  )
}

function Avatar({ thumbnail, firstName, lastName }: { thumbnail: string; firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  if (thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnail}
        alt={`${firstName} ${lastName}`}
        width={40}
        height={40}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: 40, height: 40 }}
      />
    )
  }

  return (
    <span
      className="rounded-full flex-shrink-0 flex items-center justify-center bg-slate-700 text-slate-300 text-sm font-semibold"
      style={{ width: 40, height: 40 }}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </span>
  )
}

export default function CityTooltip({ x, y, city, athletes }: CityTooltipProps) {
  const left =
    x + 16 + POPUP_WIDTH > (typeof window !== 'undefined' ? window.innerWidth : 9999)
      ? x - POPUP_WIDTH - 8
      : x + 16

  const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 9999) - POPUP_MAX_HEIGHT - 16
  const top = Math.min(y - 20, maxTop)

  return (
    <div
      className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl pointer-events-none"
      style={{ left, top, width: POPUP_WIDTH }}
    >
      <div className="px-3 pt-2.5 pb-1.5 font-semibold text-slate-100 text-sm border-b border-slate-700">
        {city}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: POPUP_MAX_HEIGHT }}>
        {athletes.map((a, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 px-3 py-2 border-b border-slate-700 last:border-0"
          >
            <Avatar thumbnail={a.thumbnail} firstName={a.first_name} lastName={a.last_name} />

            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm text-slate-100 leading-tight">
                {a.first_name} {a.last_name}
              </span>

              <div className="flex items-center gap-3 text-xs">
                <MedalCount color={MEDAL_COLORS.gold}   count={a.medals.gold} />
                <MedalCount color={MEDAL_COLORS.silver} count={a.medals.silver} />
                <MedalCount color={MEDAL_COLORS.bronze} count={a.medals.bronze} />
              </div>

              {a.sports[0] && (
                <span className="text-xs text-slate-400 truncate">{a.sports[0]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
