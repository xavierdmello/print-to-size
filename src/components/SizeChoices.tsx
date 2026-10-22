import { printDimensions } from '../lib/crop'
import { SIZES, type SizeId } from '../lib/sizes'
import type { PrintItem } from '../state'

/** Screen pixels per inch for the little size swatches, so they compare at true proportion. */
const SWATCH_SCALE = 5.2

interface SizeChoicesProps {
  item: PrintItem
  onChange: (sizeId: SizeId) => void
}

export function SizeChoices({ item, onChange }: SizeChoicesProps) {
  return (
    <div className="choice-row size-row" role="radiogroup" aria-label="Size">
      {SIZES.map((size) => {
        const print = printDimensions(size, item.shape, item.photo)
        return (
          <button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={item.sizeId === size.id}
            className="choice size-choice"
            onClick={() => onChange(size.id)}
          >
            <span className="size-swatch-area">
              <span
                className="size-swatch"
                style={{ width: print.width * SWATCH_SCALE, height: print.height * SWATCH_SCALE }}
              />
            </span>
            <span className="choice-label">{size.label}</span>
          </button>
        )
      })}
    </div>
  )
}
