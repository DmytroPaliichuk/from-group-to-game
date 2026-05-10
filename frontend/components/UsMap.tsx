'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology } from 'topojson-specification'
import CityTooltip from './CityTooltip'

interface AthleteData {
  first_name: string
  last_name: string
  olympic_paralympic: string
  seasons: string[]
  medals: { gold: number; silver: number; bronze: number }
  sports: string[]
  thumbnail: string
}

interface City {
  city: string
  state: string
  lat: number
  lng: number
  athletes: AthleteData[]
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
  onStateSelect?: (state: string) => void
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

const FIPS_TO_STATE: Record<number, string> = Object.fromEntries(
  Object.entries(STATE_FIPS).map(([abbr, fips]) => [fips, abbr])
)

export default function UsMap({ cities, selectedState, stateCities, onStateSelect }: UsMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; city: string; state: string; athletes: AthleteData[] } | null>(null)
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .style('stroke', (d: any) => FIPS_TO_STATE[Number(d.id)] === selectedState ? '#60a5fa' : null)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .style('stroke-width', (d: any) => FIPS_TO_STATE[Number(d.id)] === selectedState ? '2px' : null)
          .style('cursor', 'pointer')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('mouseenter', (event: MouseEvent, d: any) => {
            const abbr = FIPS_TO_STATE[Number(d.id)]
            if (abbr !== selectedState) {
              d3.select(event.currentTarget as SVGPathElement).style('stroke', '#facc15').style('stroke-width', '2px')
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('mouseleave', (event: MouseEvent, d: any) => {
            const abbr = FIPS_TO_STATE[Number(d.id)]
            if (abbr !== selectedState) {
              d3.select(event.currentTarget as SVGPathElement).style('stroke', null).style('stroke-width', null)
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('click', function(_event: MouseEvent, d: any) {
            const abbr = FIPS_TO_STATE[Number(d.id)]
            if (abbr && onStateSelect) {
              onStateSelect(abbr === selectedState ? '' : abbr)
            }
          })

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
          .on('mouseenter', (_event: MouseEvent, d: City) => {
            const fips = STATE_FIPS[d.state]
            if (fips !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              svg.selectAll<SVGPathElement, any>('.state')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((pd: any) => Number(pd.id) === fips)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .each(function(pd: any) {
                  if (FIPS_TO_STATE[Number(pd.id)] !== selectedState) {
                    d3.select(this).style('stroke', '#facc15').style('stroke-width', '2px')
                  }
                })
            }
          })
          .on('mousemove', (event: MouseEvent, d: City) => {
            setTooltip({ x: event.clientX, y: event.clientY, city: d.city, state: d.state, athletes: d.athletes })
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('mouseleave', (_event: MouseEvent, d: City) => {
            setTooltip(null)
            const fips = STATE_FIPS[d.state]
            if (fips !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              svg.selectAll<SVGPathElement, any>('.state')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((pd: any) => Number(pd.id) === fips)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .each(function(pd: any) {
                  if (FIPS_TO_STATE[Number(pd.id)] !== selectedState) {
                    d3.select(this).style('stroke', null).style('stroke-width', null)
                  }
                })
            }
          })

        // Draw top state cities (red dots with labels)
        if (stateCities && stateCities.length > 0) {
          const validStateCities = stateCities.filter(d => projection([d.lng, d.lat]) !== null)
          const g = svg.append('g')

          g.selectAll('circle')
            .data(validStateCities)
            .join('circle')
            .attr('cx', d => projection([d.lng, d.lat])![0])
            .attr('cy', d => projection([d.lng, d.lat])![1])
            .attr('r', 7)
            .attr('fill', 'transparent')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2)
            .style('pointer-events', 'none')

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

      {tooltip && (
        <CityTooltip x={tooltip.x} y={tooltip.y} city={tooltip.city} athletes={tooltip.athletes} />
      )}

    </div>
  )
}
