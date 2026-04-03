'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Chat from '@/components/Chat'
import MapContentSlider from '@/components/MapContentSlider'

const CHAT_MIN = 200
const CHAT_MAX = 700
const CHAT_DEFAULT = 384

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ResizableLayout({ cities }: { cities: any[] }) {
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = startX.current - e.clientX
    const next = Math.min(CHAT_MAX, Math.max(CHAT_MIN, startWidth.current + delta))
    setChatWidth(next)
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const onSeparatorMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [chatWidth, onMouseMove, onMouseUp])

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  return (
    <main className="flex flex-row h-screen overflow-hidden p-4 bg-slate-950">
      <MapContentSlider cities={cities} />

      <div
        onMouseDown={onSeparatorMouseDown}
        className="relative flex-shrink-0 flex items-center justify-center w-3 mx-1 cursor-col-resize group"
        aria-hidden="true"
      >
        <div className="w-0.5 h-full rounded-full bg-slate-700 group-hover:bg-slate-500 transition-colors" />
        <div className="absolute flex flex-col gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-slate-400 transition-colors" />
          ))}
        </div>
      </div>

      <div style={{ width: chatWidth }} className="flex-shrink-0 h-full">
        <Chat />
      </div>
    </main>
  )
}
