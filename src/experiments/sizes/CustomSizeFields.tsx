/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Width and height boxes under the Custom size, in the paper's units. Typing a width larger
 * than the height makes the frame wide, and the other way round makes it tall.
 */
import { useState } from 'react'
import type { Shape } from '../../lib/crop'
import type { Paper } from '../../lib/paper'
import { getSize, type CustomSize } from '../../lib/sizes'
import type { PrintItem } from '../../state'
import { roundToUnit, unitFor } from '../onPhoto/measure'

interface CustomSizeFieldsProps {
  item: PrintItem
  paper: Paper
  onChange: (shape: Shape, custom: CustomSize) => void
}

const PER_INCH = { in: 1, cm: 2.54 }

export function CustomSizeFields({ item, paper, onChange }: CustomSizeFieldsProps) {
  const unit = unitFor(paper.id)
  const size = getSize('custom', paper, item.custom)
  const [width, height] = item.shape === 'wide' ? [size.long, size.short] : [size.short, size.long]
  const toField = (inches: number) => String(Math.round(roundToUnit(inches, unit) * PER_INCH[unit] * 100) / 100)

  // What's typed is kept as typed until it's a usable number, so half-typed values don't jump.
  const [draft, setDraft] = useState<{ width: string; height: string } | null>(null)
  const shown = draft ?? { width: toField(width), height: toField(height) }

  function change(next: { width: string; height: string }) {
    setDraft(next)
    const w = Number(next.width) / PER_INCH[unit]
    const h = Number(next.height) / PER_INCH[unit]
    if (!(w > 0 && h > 0)) return
    onChange(w >= h ? 'wide' : 'tall', { short: Math.min(w, h), long: Math.max(w, h) })
  }

  return (
    <div className="custom-size" onBlur={() => setDraft(null)}>
      <input
        id="custom-width"
        type="number"
        inputMode="decimal"
        min={0}
        step={unit === 'cm' ? 0.5 : 0.25}
        aria-label={`Width in ${unit === 'cm' ? 'centimetres' : 'inches'}`}
        value={shown.width}
        onChange={(event) => change({ ...shown, width: event.currentTarget.value })}
      />
      <span>×</span>
      <input
        id="custom-height"
        type="number"
        inputMode="decimal"
        min={0}
        step={unit === 'cm' ? 0.5 : 0.25}
        aria-label={`Height in ${unit === 'cm' ? 'centimetres' : 'inches'}`}
        value={shown.height}
        onChange={(event) => change({ ...shown, height: event.currentTarget.value })}
      />
      <span>{unit}</span>
    </div>
  )
}
