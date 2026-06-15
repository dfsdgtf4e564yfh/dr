import { useEffect, useRef, RefObject } from 'react'

export function usePointerEvents(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'pen') {
        el.style.cursor = 'crosshair'
      }
    }

    el.addEventListener('pointerdown', handlePointerDown)
    return () => el.removeEventListener('pointerdown', handlePointerDown)
  }, [ref])
}

export function usePreventZoom(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handler = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
      }
    }

    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [ref])
}
