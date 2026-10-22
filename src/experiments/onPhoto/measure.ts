/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Lengths in the units of the chosen paper, and snapping a dragged frame to a standard size.
 */
import type { Shape } from '../../lib/crop'
import type { PaperId } from '../../lib/paper'
import type { CustomSize, PrintSize, SizeId } from '../../lib/sizes'

export type Unit = 'in' | 'cm'

const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' }

export function unitFor(paperId: PaperId): Unit {
  return paperId === 'a4' ? 'cm' : 'in'
}

/** "6 in", "3½ in", "4.3 in"; "15 cm", "3.5 cm". */
export function formatLength(inches: number, unit: Unit): string {
  if (unit === 'cm') {
    const cm = inches * 2.54
    const whole = Math.round(cm)
    return Math.abs(cm - whole) < 0.05 ? `${whole} cm` : `${cm.toFixed(1)} cm`
  }
  const quarters = Math.round(inches * 4) / 4
  if (Math.abs(inches - quarters) < 0.02) {
    const whole = Math.floor(quarters)
    const fraction = FRACTIONS[quarters - whole] ?? ''
    return `${whole === 0 && fraction ? '' : whole}${fraction} in`
  }
  return `${inches.toFixed(1)} in`
}

/** "5 × 3½ in", width first. */
export function formatFrame(width: number, height: number, unit: Unit): string {
  const [w, h] = [formatLength(width, unit), formatLength(height, unit)]
  return `${w.replace(/ (in|cm)$/, '')} × ${h}`
}

/** The step a typed or dragged custom size is rounded to: a twentieth of an inch, or a millimetre. */
export function roundToUnit(inches: number, unit: Unit): number {
  return unit === 'cm' ? Math.round(inches * 25.4) / 25.4 : Math.round(inches * 20) / 20
}

export interface SnappedFrame {
  sizeId: SizeId
  shape: Shape
  custom?: CustomSize
  width: number
  height: number
}

/** How close, in inches, a dragged frame has to come to a standard size to land on it. */
export const SNAP = 0.18

/**
 * Turns a frame dragged to `width` × `height` inches into a size: a standard one when the
 * drag lands near it, otherwise a custom size rounded to the paper's units.
 */
export function snapFrame(width: number, height: number, sizes: readonly PrintSize[], unit: Unit): SnappedFrame {
  const shape: Shape = width >= height ? 'wide' : 'tall'
  const short = Math.min(width, height)
  const long = Math.max(width, height)
  const nearest = sizes
    .map((size) => ({ size, distance: Math.max(Math.abs(size.short - short), Math.abs(size.long - long)) }))
    .filter(({ distance }) => distance <= SNAP)
    .sort((a, b) => a.distance - b.distance)[0]?.size

  if (nearest) {
    const [w, h] = shape === 'wide' ? [nearest.long, nearest.short] : [nearest.short, nearest.long]
    return { sizeId: nearest.id, shape, width: w, height: h }
  }
  const custom = { short: roundToUnit(short, unit), long: roundToUnit(long, unit) }
  const [w, h] = shape === 'wide' ? [custom.long, custom.short] : [custom.short, custom.long]
  return { sizeId: 'custom', shape, custom, width: w, height: h }
}
