import { CENTERED, MAX_ZOOM, cropRect, panCrop, zoomCrop, type Crop } from '../lib/crop'
import { itemCrop, itemDimensions, type PrintItem } from '../state'
import { ArrowIcon, ZoomInIcon, ZoomOutIcon } from './icons'
import { NUDGE, ZOOM_STEP } from './placement'

interface AdjustPadProps {
  item: PrintItem | null
  onCrop: (crop: Crop) => void
}

export function AdjustPad({ item, onCrop }: AdjustPadProps) {
  if (!item || item.shape === 'whole') {
    return <div className="adjust" aria-hidden="true" />
  }

  const { photo } = item
  const print = itemDimensions(item)
  const aspect = print.width / print.height
  const crop = itemCrop(item)
  const rect = cropRect(photo, aspect, crop)
  const step = { x: rect.width * NUDGE, y: rect.height * NUDGE }
  const pan = (dx: number, dy: number) => onCrop(panCrop(photo, aspect, crop, dx, dy))
  const isCentered = crop.zoom === 1 && Math.abs(crop.cx - 0.5) < 1e-6 && Math.abs(crop.cy - 0.5) < 1e-6

  const moves = [
    { label: 'Move photo left', rotate: -90, disabled: rect.x + rect.width >= photo.width - 0.5, onClick: () => pan(-step.x, 0) },
    { label: 'Move photo up', rotate: 0, disabled: rect.y + rect.height >= photo.height - 0.5, onClick: () => pan(0, -step.y) },
    { label: 'Move photo down', rotate: 180, disabled: rect.y <= 0.5, onClick: () => pan(0, step.y) },
    { label: 'Move photo right', rotate: 90, disabled: rect.x <= 0.5, onClick: () => pan(step.x, 0) },
  ]

  return (
    <div className="adjust">
      <div className="button-row">
        {moves.map((move) => (
          <button
            key={move.label}
            type="button"
            className="button icon"
            aria-label={move.label}
            title={move.label}
            disabled={move.disabled}
            onClick={move.onClick}
          >
            <ArrowIcon rotate={move.rotate} />
          </button>
        ))}
      </div>
      <div className="button-row">
        <button
          type="button"
          className="button icon"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={crop.zoom <= 1}
          onClick={() => onCrop(zoomCrop(photo, aspect, crop, 1 / ZOOM_STEP))}
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          className="button icon"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={crop.zoom >= MAX_ZOOM}
          onClick={() => onCrop(zoomCrop(photo, aspect, crop, ZOOM_STEP))}
        >
          <ZoomInIcon />
        </button>
      </div>
      <button type="button" className="button" disabled={isCentered} onClick={() => onCrop(CENTERED)}>
        Reset
      </button>
    </div>
  )
}
