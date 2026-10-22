import { useLayoutEffect, useState, type RefObject } from 'react'
import type { Dimensions } from '../lib/crop'

export function useElementSize(ref: RefObject<HTMLElement | null>): Dimensions | null {
  const [size, setSize] = useState<Dimensions | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((previous) => (previous?.width === width && previous?.height === height ? previous : { width, height }))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
