import { useMemo, type ReactNode } from 'react'
import type { Shape } from '../lib/crop'
import { layoutSheets } from '../lib/layout'
import type { Paper } from '../lib/paper'
import { getSize, sizesFor, type CustomSize, type PrintSize, type SizeId } from '../lib/sizes'
import samplePhoto from './sample-photo.svg'

/** Enough copies to fill a page with even the smallest size. */
const FILL = 40

interface SizeListProps {
  shape: Shape
  paper: Paper
  sizeId: SizeId
  onChange: (sizeId: SizeId) => void
  /** Which sizes to offer, in order. Defaults to the paper's standard sizes. */
  sizeIds?: readonly SizeId[]
  /** The selected photo's custom size, for the Custom entry. */
  custom?: CustomSize
  describe?: (size: PrintSize) => string
  /** Shown under a size's entry. */
  renderBelow?: (sizeId: SizeId) => ReactNode
}

/** Each size as a little sheet of paper filled with a sample photo, like the Windows 7 layouts. */
export function SizeList({ shape, paper, sizeId, onChange, sizeIds, custom, describe, renderBelow }: SizeListProps) {
  const ids = sizeIds ?? sizesFor(paper.id)
  const sheets = useMemo(
    () =>
      ids.map((id) => {
        const size = getSize(id, paper, custom)
        const tall = shape === 'tall'
        const piece = { key: id, width: tall ? size.short : size.long, height: tall ? size.long : size.short }
        const [page] = layoutSheets(Array.from({ length: id === 'full' ? 1 : FILL }, () => piece), paper)
        return { size, page }
      }),
    [ids, shape, paper, custom],
  )

  return (
    <div className="size-list" role="radiogroup" aria-label="Size">
      {sheets.map(({ size, page }) => (
        <div key={size.id} className="size-entry">
          <button
            type="button"
            role="radio"
            aria-checked={sizeId === size.id}
            className="size-option"
            onClick={() => onChange(size.id)}
          >
            <span className="size-sheet-area" aria-hidden="true">
              <span
                className={`size-sheet${page.landscape ? ' is-landscape' : ''}`}
                style={{ aspectRatio: `${page.width} / ${page.height}` }}
              >
                {page.placements.map((p, index) => (
                  <img
                    key={index}
                    src={samplePhoto}
                    alt=""
                    draggable={false}
                    style={{
                      left: `${(p.x / page.width) * 100}%`,
                      top: `${(p.y / page.height) * 100}%`,
                      width: `${(p.width / page.width) * 100}%`,
                      height: `${(p.height / page.height) * 100}%`,
                    }}
                  />
                ))}
              </span>
            </span>
            <span className="size-label">
              {describe ? describe(size) : size.label}
              {size.id !== 'full' && ` (${page.placements.length})`}
            </span>
          </button>
          {renderBelow?.(size.id)}
        </div>
      ))}
    </div>
  )
}
