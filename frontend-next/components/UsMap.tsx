'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology } from 'topojson-specification'

interface City {
  city: string
  state: string
  lat: number
  lng: number
}

interface StateCityEntry {
  city: string
  lat: number
  lng: number
}

interface UsMapProps {
  cities: City[]
  selectedState?: string
  stateCities?: StateCityEntry[]
}

const STATE_FIPS: Record<string, number> = {
  AL: 1,  AK: 2,  AZ: 4,  AR: 5,  CA: 6,  CO: 8,  CT: 9,  DE: 10,
  DC: 11, FL: 12, GA: 13, HI: 15, ID: 16, IL: 17, IN: 18, IA: 19,
  KS: 20, KY: 21, LA: 22, ME: 23, MD: 24, MA: 25, MI: 26, MN: 27,
  MS: 28, MO: 29, MT: 30, NE: 31, NV: 32, NH: 33, NJ: 34, NM: 35,
  NY: 36, NC: 37, ND: 38, OH: 39, OK: 40, OR: 41, PA: 42, RI: 44,
  SC: 45, SD: 46, TN: 47, TX: 48, UT: 49, VT: 50, VA: 51, WA: 53,
  WV: 54, WI: 55, WY: 56,
}

export default function UsMap({ cities, selectedState, stateCities }: UsMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; city: string; state: string } | null>(null)
  const [activeCity, setActiveCity] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const width = 1200
    const height = 750
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const projection = d3.geoAlbersUsa().scale(1600).translate([width / 2, height / 2])
    const path = d3.geoPath().projection(projection)

    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => r.json())
      .then((us: Topology) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allFeatures = (topojson.feature(us, (us.objects as any).states) as any).features

        let visibleFeatures = allFeatures
        if (selectedState && STATE_FIPS[selectedState] !== undefined) {
          const fips = STATE_FIPS[selectedState]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stateFeature = allFeatures.find((f: any) => Number(f.id) === fips)
          if (stateFeature) {
            visibleFeatures = [stateFeature]
            projection.fitExtent([[40, 40], [width - 40, height - 40]], stateFeature)
          }
        }

        // Draw states
        svg.append('g')
          .selectAll('path')
          .data(visibleFeatures)
          .join('path')
          .attr('class', 'state')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('d', path as any)

        // State borders (only when showing all states)
        if (!selectedState) {
          svg.append('path')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .datum(topojson.mesh(us, (us.objects as any).states, (a: any, b: any) => a !== b))
            .attr('fill', 'none')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 0.8)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr('d', path as any)
        }

        // Draw city dots
        svg.append('g')
          .selectAll('circle')
          .data(cities.filter(d => projection([d.lng, d.lat]) !== null))
          .join('circle')
          .attr('class', d => `city-dot${activeCity === d.city ? ' active' : ''}`)
          .attr('cx', d => projection([d.lng, d.lat])![0])
          .attr('cy', d => projection([d.lng, d.lat])![1])
          .attr('r', d => (activeCity === d.city ? 8 : 5))
          .attr('fill', d => (activeCity === d.city ? '#f472b6' : '#38bdf8'))
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mousemove', (event: MouseEvent, d: City) => {
            setTooltip({ x: event.clientX, y: event.clientY, city: d.city, state: d.state })
          })
          .on('mouseleave', () => setTooltip(null))

        // Draw top state cities (red dots with labels)
        if (stateCities && stateCities.length > 0) {
          const validStateCities = stateCities.filter(d => projection([d.lng, d.lat]) !== null)
          const g = svg.append('g')

          g.selectAll('circle')
            .data(validStateCities)
            .join('circle')
            .attr('cx', d => projection([d.lng, d.lat])![0])
            .attr('cy', d => projection([d.lng, d.lat])![1])
            .attr('r', 6)
            .attr('fill', '#ef4444')
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 1)

          g.selectAll('text')
            .data(validStateCities)
            .join('text')
            .attr('x', d => projection([d.lng, d.lat])![0])
            .attr('y', d => projection([d.lng, d.lat])![1] + 18)
            .attr('text-anchor', 'middle')
            .attr('fill', '#f1f5f9')
            .attr('font-size', '12')
            .attr('font-weight', '600')
            .text(d => d.city)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, activeCity, selectedState, stateCities])

  return (
    <div className="relative w-full">
      <div className="w-full bg-slate-800 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <svg ref={svgRef} viewBox="0 0 1200 750" className="block w-full h-auto" />
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-10 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
        >
          <div className="font-semibold text-slate-100">{tooltip.city}</div>
          <div className="text-slate-400">{tooltip.state}</div>
        </div>
      )}

    </div>
  )
}
