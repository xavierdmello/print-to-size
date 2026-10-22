import { CENTERED, printDimensions, type Shape } from '../lib/crop'
import { getSize } from '../lib/sizes'
import type { PrintItem } from '../state'
import { PhotoCrop } from './PhotoCrop'

const SHAPES: { shape: Shape; label: string }[] = [
  { shape: 'wide', label: 'Wide' },
  { shape: 'tall', label: 'Tall' },
  { shape: 'whole', label: 'Whole photo' },
]

const THUMB_HEIGHT = 64

interface ShapeChoicesProps {
  item: PrintItem
  onChange: (shape: Shape) => void
}

export function ShapeChoices({ item, onChange }: ShapeChoicesProps) {
  const size = getSize(item.sizeId)
  return (
    <div className="choice-row" role="radiogroup" aria-label="Shape">
      {SHAPES.map(({ shape, label }) => {
        const print = printDimensions(size, shape, item.photo)
        const crop = shape === 'whole' ? CENTERED : item.crops[shape]
        return (
          <button
            key={shape}
            type="button"
            role="radio"
            aria-checked={item.shape === shape}
            className="choice shape-choice"
            onClick={() => onChange(shape)}
          >
            <span className="shape-thumb" style={{ height: THUMB_HEIGHT }}>
              <PhotoCrop
                photo={item.photo}
                shape={shape}
                crop={crop}
                print={print}
                className="thumb-print"
                style={{ height: THUMB_HEIGHT, width: (THUMB_HEIGHT * print.width) / print.height }}
              />
            </span>
            <span className="choice-label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
