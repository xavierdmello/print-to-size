import { CENTERED, MAX_ZOOM, cropRect, panCrop, zoomCrop, type Crop, type Dimensions } from '../lib/crop'
import { itemCrop, itemDimensions, type PrintItem } from '../state'
import { ArrowIcon, ZoomInIcon, ZoomOutIcon } from './icons'
import { NUDGE, ZOOM_STEP, screenToPhoto } from './placement'

interface AdjustPadProps {
  item: PrintItem | null
  paper: Dimensions
  /** Whether the photo is shown turned sideways on the page, so the arrows follow the screen. */
  rotated: boolean
  onCrop: (crop: Crop) => void
}

/** Directions the crop moves on screen. */
const MOVES = [
  { label: 'Move crop left', rotate: -90, x: -1, y: 0 },
  { label: 'Move crop up', rotate: 0, x: 0, y: -1 },
  { label: 'Move crop down', rotate: 180, x: 0, y: 1 },
  { label: 'Move crop right', rotate: 90, x: 1, y: 0 },
]

function sameCrop(a: Crop, b: Crop): boolean {
  return Math.abs(a.zoom - b.zoom) < 1e-9 && Math.abs(a.cx - b.cx) < 1e-9 && Math.abs(a.cy - b.cy) < 1e-9
}

/** Arrow, zoom and reset buttons. They stay in place and grey out when there's no crop to adjust. */
export function AdjustPad({ item, paper, rotated, onCrop }: AdjustPadProps) {
  const target = item?.fit ? item : null
  const crop = target ? itemCrop(target) : CENTERED

  // Moving the crop one way means moving the photo the other way.
  function moved(x: number, y: number): Crop | null {
    if (!target) return null
    const print = itemDimensions(target, paper)
    const aspect = print.width / print.height
    const rect = cropRect(target.photo, aspect, crop)
    const [dx, dy] = screenToPhoto(-x, -y, rotated)
    return panCrop(target.photo, aspect, crop, dx * rect.width * NUDGE, dy * rect.height * NUDGE)
  }

  function zoomed(factor: number): Crop | null {
    if (!target) return null
    const print = itemDimensions(target, paper)
    return zoomCrop(target.photo, print.width / print.height, crop, factor)
  }

  const zoomOut = zoomed(1 / ZOOM_STEP)
  const zoomIn = zoomed(ZOOM_STEP)

  return (
    <div className="adjust">
      <div className="button-row">
        {MOVES.map((move) => {
          const next = moved(move.x, move.y)
          return (
            <button
              key={move.label}
              type="button"
              className="button icon"
              aria-label={move.label}
              title={move.label}
              disabled={!next || sameCrop(next, crop)}
              onClick={() => next && onCrop(next)}
            >
              <ArrowIcon rotate={move.rotate} />
            </button>
          )
        })}
      </div>
      <div className="button-row">
        <button
          type="button"
          className="button icon"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={!zoomOut || crop.zoom <= 1}
          onClick={() => zoomOut && onCrop(zoomOut)}
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          className="button icon"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={!zoomIn || crop.zoom >= MAX_ZOOM}
          onClick={() => zoomIn && onCrop(zoomIn)}
        >
          <ZoomInIcon />
        </button>
      </div>
      <button type="button" className="button" disabled={!target || sameCrop(crop, CENTERED)} onClick={() => onCrop(CENTERED)}>
        Reset
      </button>
    </div>
  )
}
