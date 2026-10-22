import { printDimensions, type Shape } from '../lib/crop'
import { SIZES, type SizeId } from '../lib/sizes'
import { itemCrop, type PrintItem } from '../state'
import { PhotoCrop } from './PhotoCrop'

/** Thumbnail pixels per printed inch, so sizes compare at true proportion. */
const THUMB_SCALE = 10

interface SizeListProps {
  item: PrintItem | null
  sizeId: string
  onChange: (sizeId: SizeId) => void
}

export function SizeList({ item, sizeId, onChange }: SizeListProps) {
  const shape: Shape = item?.shape ?? 'wide'
  return (
    <div className="size-list" role="radiogroup" aria-label="Size">
      {SIZES.map((size) => {
        const print = item ? printDimensions(size, shape, item.photo) : { width: size.long, height: size.short }
        const thumb = { width: print.width * THUMB_SCALE, height: print.height * THUMB_SCALE }
        return (
          <button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={sizeId === size.id}
            className="size-option"
            onClick={() => onChange(size.id)}
          >
            <span className="size-thumb">
              {item ? (
                <PhotoCrop
                  photo={item.photo}
                  shape={shape}
                  crop={itemCrop(item)}
                  print={print}
                  className="size-thumb-photo"
                  style={thumb}
                />
              ) : (
                <span className="size-thumb-blank" style={thumb} />
              )}
            </span>
            <span className="size-label">{size.id === 'wallet' ? 'Wallet' : `${size.label} in.`}</span>
          </button>
        )
      })}
    </div>
  )
}
