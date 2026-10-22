/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see docs/development.md, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Size boxes for the selected photo, pinned under the size list. Like the list's labels, they
 * read short side × long side whichever way the photo is turned; Wide/Tall stays the shape
 * switch's job, so typing a size never turns the photo. A typed size lands on a standard one
 * when it's close, as dragging an edge does, and becomes Custom size otherwise. Greyed out
 * until there's a photo, showing the size picked in the list.
 */
import { useState } from 'react'
import type { Paper } from '../../lib/paper'
import { getSize, type SizeId } from '../../lib/sizes'
import { roundToUnit, unitFor, type SnappedFrame } from '../onPhoto/measure'
import type { PrintItem } from '../../state'

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
  const size = item ? getSize(item.sizeId, paper, item.custom) : getSize(sizeId, paper)
  const toField = (inches: number) => String(Math.round(roundToUnit(inches, unit) * PER_INCH[unit] * 100) / 100)

  // What's typed is kept as typed while the box has focus, so half-typed values don't jump.
  const [draft, setDraft] = useState<{ short: string; long: string } | null>(null)
  const shown = draft ?? { short: toField(size.short), long: toField(size.long) }

  function change(next: { short: string; long: string }) {
    setDraft(next)
    const a = Number(next.short) / PER_INCH[unit]
    const b = Number(next.long) / PER_INCH[unit]
    if (!item || !(a > 0 && b > 0)) return
    const [short, long] = [Math.min(a, b), Math.max(a, b)]
    onChange(item.shape === 'tall' ? resolve(short, long) : resolve(long, short))
  }

  const step = unit === 'cm' ? 0.5 : 0.25
  const unitName = unit === 'cm' ? 'centimetres' : 'inches'

  return (
    <div className="size-fields" role="group" aria-labelledby="size-fields-label" onBlur={() => setDraft(null)}>
      <span id="size-fields-label">Size:</span>
      <input
        id="size-short"
        className="number-input"
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        aria-label={`Short side in ${unitName}`}
        disabled={!item}
        value={shown.short}
        onChange={(event) => change({ ...shown, short: event.currentTarget.value })}
      />
      <span>×</span>
      <input
        id="size-long"
        className="number-input"
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        aria-label={`Long side in ${unitName}`}
        disabled={!item}
        value={shown.long}
        onChange={(event) => change({ ...shown, long: event.currentTarget.value })}
      />
      <span>{unit}</span>
    </div>
  )
}
