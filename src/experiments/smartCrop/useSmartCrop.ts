/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Applies the face-aware starting crop to crops the viewer hasn't touched: ones still
 * centred, or still where this hook last put them (so a size change re-applies it, and
 * Reset lands back on the suggestion).
 */
import { useEffect, useRef, useState, type Dispatch } from 'react'
import { CENTERED, printDimensions, type Crop, type Dimensions, type Shape } from '../../lib/crop'
import { getSize } from '../../lib/sizes'
import type { Action, PrintItem } from '../../state'
import { detectFaces } from './detectFaces'
import { nudgeForFaces, type Face } from './nudge'

const SHAPES: Shape[] = ['wide', 'tall']

function same(a: Crop, b: Crop): boolean {
  return Math.abs(a.zoom - b.zoom) < 1e-6 && Math.abs(a.cx - b.cx) < 1e-6 && Math.abs(a.cy - b.cy) < 1e-6
}

export function useSmartCrop(
  items: readonly PrintItem[],
  paper: Dimensions,
  enabled: boolean,
  dispatch: Dispatch<Action>,
): string {
  const [faces, setFaces] = useState(new Map<string, Face[]>())
  const [status, setStatus] = useState('')
  const requested = useRef(new Set<string>())
  const applied = useRef(new Map<string, Crop>())

  useEffect(() => {
    if (!enabled) return
    for (const item of items) {
      if (requested.current.has(item.photo.id)) continue
      requested.current.add(item.photo.id)
      setStatus('Looking for faces…')
      detectFaces(item.photo.bitmap)
        .then((found) => {
          setFaces((previous) => new Map(previous).set(item.photo.id, found))
          setStatus(`${found.length} face${found.length === 1 ? '' : 's'} in ${item.photo.name}`)
        })
        .catch((error: unknown) => {
          requested.current.delete(item.photo.id)
          setStatus(`Face detection unavailable: ${error instanceof Error ? error.message : String(error)}`)
        })
    }
  }, [items, enabled])

  useEffect(() => {
    if (!enabled) return
    for (const item of items) {
      const found = faces.get(item.photo.id)
      if (!found) continue
      for (const shape of SHAPES) {
        const key = `${item.id}:${shape}`
        const current = item.crops[shape]
        const previous = applied.current.get(key)
        if (!same(current, CENTERED) && !(previous && same(current, previous))) continue
        const print = printDimensions(getSize(item.sizeId, paper), shape)
        const suggested = nudgeForFaces(item.photo, print.width / print.height, CENTERED, found)
        applied.current.set(key, suggested)
        if (!same(current, suggested)) dispatch({ type: 'setCrop', id: item.id, shape, crop: suggested })
      }
    }
  }, [items, paper, faces, enabled, dispatch])

  return status
}
