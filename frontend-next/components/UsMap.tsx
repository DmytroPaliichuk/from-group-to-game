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

interface UsMapProps {
  cities: City[]
}

export default function UsMap({ cities }: UsMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; city: string; state: string } | null>(null)
  const [activeCity, setActiveCity] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const width = 960
    const height = 600
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2])
    const path = d3.geoPath().projection(projection)

    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => r.json())
      .then((us: Topology) => {
        // Draw states
        svg.append('g')
          .selectAll('path')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .data((topojson.feature(us, (us.objects as any).states) as any).features)
          .join('path')
          .attr('class', 'state')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('d', path as any)

        // State borders
        svg.append('path')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .datum(topojson.mesh(us, (us.objects as any).states, (a: any, b: any) => a !== b))
          .attr('fill', 'none')
          .attr('stroke', '#64748b')
          .attr('stroke-width', 0.8)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('d', path as any)

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
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, activeCity])

  return (
    <div className="relative">
      <div className="w-full max-w-[960px] bg-slate-800 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <svg ref={svgRef} viewBox="0 0 960 600" className="block w-full h-auto" />
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

      {/* City tag list */}
      <div className="w-full max-w-[960px] mt-5 flex flex-wrap gap-2">
        {cities.map(d => (
          <span
            key={`${d.city}-${d.state}`}
            className={`border rounded-full px-3 py-1 text-xs cursor-pointer transition-colors duration-150
              ${activeCity === d.city
                ? 'bg-sky-400 border-sky-400 text-slate-900 font-semibold'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-sky-400 hover:border-sky-400 hover:text-slate-900 hover:font-semibold'
              }`}
            onMouseEnter={() => setActiveCity(d.city)}
            onMouseLeave={() => setActiveCity(null)}
          >
            {d.city}, {d.state}
          </span>
        ))}
      </div>
    </div>
  )
}
