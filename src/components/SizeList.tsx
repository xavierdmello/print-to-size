import { useMemo } from 'react'
import type { Shape } from '../lib/crop'
import { layoutSheets } from '../lib/layout'
import type { Paper } from '../lib/paper'
import { SIZE_IDS, getSize, type SizeId } from '../lib/sizes'
import samplePhoto from './sample-photo.svg'

/** Enough copies to fill a page with even the smallest size. */
const FILL = 40

interface SizeListProps {
  shape: Shape
  paper: Paper
  sizeId: SizeId
  onChange: (sizeId: SizeId) => void
}

/** Each size as a little sheet of paper filled with a sample photo, like the Windows 7 layouts. */
export function SizeList({ shape, paper, sizeId, onChange }: SizeListProps) {
  const sheets = useMemo(
    () =>
      SIZE_IDS.map((id) => {
        const size = getSize(id, paper)
        const tall = shape === 'tall'
        const piece = { key: id, width: tall ? size.short : size.long, height: tall ? size.long : size.short }
        const [page] = layoutSheets(Array.from({ length: id === 'full' ? 1 : FILL }, () => piece), paper)
        return { size, placements: page.placements }
      }),
    [shape, paper],
  )

  return (
    <div className="size-list" role="radiogroup" aria-label="Size">
      {sheets.map(({ size, placements }) => (
        <button
          key={size.id}
          type="button"
          role="radio"
          aria-checked={sizeId === size.id}
          className="size-option"
          onClick={() => onChange(size.id)}
        >
          <span className="size-sheet" style={{ aspectRatio: `${paper.width} / ${paper.height}` }} aria-hidden="true">
            {placements.map((p, index) => (
              <img
                key={index}
                src={samplePhoto}
                alt=""
                draggable={false}
                style={{
                  left: `${(p.x / paper.width) * 100}%`,
                  top: `${(p.y / paper.height) * 100}%`,
                  width: `${(p.width / paper.width) * 100}%`,
                  height: `${(p.height / paper.height) * 100}%`,
                }}
              />
            ))}
          </span>
          <span className="size-label">
            {size.label}
            {size.id !== 'full' && ` (${placements.length})`}
          </span>
        </button>
      ))}
    </div>
  )
}
