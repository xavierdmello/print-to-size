/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Width and height boxes for the selected photo, pinned under the size list. They always show
 * its printed size; typing a new one lands on a standard size when it's close, as dragging an
 * edge does, and becomes Custom size otherwise. Greyed out until there's a photo, showing the
 * size picked in the list.
 */
import { useState } from 'react'
import { printDimensions } from '../../lib/crop'
import type { Paper } from '../../lib/paper'
import { getSize, type SizeId } from '../../lib/sizes'
import { roundToUnit, unitFor, type SnappedFrame } from '../onPhoto/measure'
import { itemDimensions, type PrintItem } from '../../state'

interface SizeFieldsProps {
  item: PrintItem | null
  /** The size picked in the list, shown while there's no photo. */
  sizeId: SizeId
  paper: Paper
  /** How a frame of `width` × `height` inches would land. */
  resolve: (width: number, height: number) => SnappedFrame
  onChange: (frame: SnappedFrame) => void
}

const PER_INCH = { in: 1, cm: 2.54 }

export function SizeFields({ item, sizeId, paper, resolve, onChange }: SizeFieldsProps) {
  const unit = unitFor(paper.id)
  const print = item ? itemDimensions(item, paper) : printDimensions(getSize(sizeId, paper), 'wide')
  const toField = (inches: number) => String(Math.round(roundToUnit(inches, unit) * PER_INCH[unit] * 100) / 100)

  // What's typed is kept as typed while the box has focus, so half-typed values don't jump.
  const [draft, setDraft] = useState<{ width: string; height: string } | null>(null)
  const shown = draft ?? { width: toField(print.width), height: toField(print.height) }

  function change(next: { width: string; height: string }) {
    setDraft(next)
    const width = Number(next.width) / PER_INCH[unit]
    const height = Number(next.height) / PER_INCH[unit]
    if (item && width > 0 && height > 0) onChange(resolve(width, height))
  }

  const step = unit === 'cm' ? 0.5 : 0.25
  const unitName = unit === 'cm' ? 'centimetres' : 'inches'

  return (
    <div className="size-fields" role="group" aria-labelledby="size-fields-label" onBlur={() => setDraft(null)}>
      <span id="size-fields-label">Size:</span>
      <input
        id="size-width"
        className="number-input"
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        aria-label={`Width in ${unitName}`}
        disabled={!item}
        value={shown.width}
        onChange={(event) => change({ ...shown, width: event.currentTarget.value })}
      />
      <span>×</span>
      <input
        id="size-height"
        className="number-input"
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        aria-label={`Height in ${unitName}`}
        disabled={!item}
        value={shown.height}
        onChange={(event) => change({ ...shown, height: event.currentTarget.value })}
      />
      <span>{unit}</span>
    </div>
  )
}
