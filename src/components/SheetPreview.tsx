import type { CSSProperties } from 'react'
import type { Placement, SheetPage } from '../lib/layout'
import type { Paper } from '../lib/paper'
import { itemCrop, itemDimensions, type PrintItem } from '../state'
import { PhotoCrop } from './PhotoCrop'

interface SheetPreviewProps {
  pages: SheetPage[]
  paper: Paper
  items: PrintItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function percentOf(placement: Placement, paper: Paper): CSSProperties {
  return {
    left: `${(placement.x / paper.width) * 100}%`,
    top: `${(placement.y / paper.height) * 100}%`,
    width: `${(placement.width / paper.width) * 100}%`,
    height: `${(placement.height / paper.height) * 100}%`,
  }
}

/** A rotated piece is drawn upright, then turned a quarter anticlockwise like in the PDF. */
function rotatedStyle(placement: Placement): CSSProperties {
  return {
    position: 'absolute',
    width: `${(placement.height / placement.width) * 100}%`,
    height: `${(placement.width / placement.height) * 100}%`,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%) rotate(-90deg)',
  }
}

export function SheetPreview({ pages, paper, items, selectedId, onSelect }: SheetPreviewProps) {
  const byId = new Map(items.map((item) => [item.id, item]))
  return (
    <div className="sheets">
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="sheet"
          style={{ aspectRatio: `${paper.width} / ${paper.height}` }}
          aria-label={pages.length > 1 ? `Page ${pageIndex + 1} of ${pages.length}` : 'Page'}
        >
          {page.placements.map((placement, index) => {
            const item = byId.get(placement.key)
            if (!item) return null
            const upright = itemDimensions(item)
            const photo = (
              <PhotoCrop
                photo={item.photo}
                shape={item.shape}
                crop={itemCrop(item)}
                print={upright}
                style={placement.rotated ? rotatedStyle(placement) : undefined}
              />
            )
            return (
              <button
                key={`${placement.key}-${index}`}
                type="button"
                className="sheet-piece"
                aria-pressed={item.id === selectedId}
                aria-label={`Select ${item.photo.name}`}
                style={percentOf(placement, paper)}
                onClick={() => onSelect(item.id)}
              >
                {photo}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
