import { CENTERED, MAX_ZOOM, cropRect, panCrop, zoomCrop, type Crop } from '../lib/crop'
import { itemCrop, itemDimensions, type PrintItem } from '../state'
import { NUDGE, ZOOM_STEP } from './placement'
import { ArrowIcon, ResetIcon, ZoomInIcon, ZoomOutIcon } from './icons'

interface AdjustPadProps {
  item: PrintItem
  onCrop: (crop: Crop) => void
}

export function AdjustPad({ item, onCrop }: AdjustPadProps) {
  const { photo } = item
  const print = itemDimensions(item)
  const aspect = print.width / print.height
  const crop = itemCrop(item)
  const rect = cropRect(photo, aspect, crop)
  const step = { x: rect.width * NUDGE, y: rect.height * NUDGE }

  const canMoveX = rect.width < photo.width - 0.5
  const canMoveY = rect.height < photo.height - 0.5
  const isCentered = crop.zoom === 1 && Math.abs(crop.cx - 0.5) < 1e-6 && Math.abs(crop.cy - 0.5) < 1e-6
  const pan = (dx: number, dy: number) => onCrop(panCrop(photo, aspect, crop, dx, dy))

  const moves = [
    { label: 'Move photo up', area: 'up', rotate: 0, disabled: !canMoveY || rect.y + rect.height >= photo.height - 0.5, onClick: () => pan(0, -step.y) },
    { label: 'Move photo left', area: 'left', rotate: -90, disabled: !canMoveX || rect.x + rect.width >= photo.width - 0.5, onClick: () => pan(-step.x, 0) },
    { label: 'Move photo right', area: 'right', rotate: 90, disabled: !canMoveX || rect.x <= 0.5, onClick: () => pan(step.x, 0) },
    { label: 'Move photo down', area: 'down', rotate: 180, disabled: !canMoveY || rect.y <= 0.5, onClick: () => pan(0, step.y) },
  ]

  return (
    <div className="adjust-pad">
      <div className="adjust-moves">
        {moves.map((move) => (
          <button
            key={move.area}
            type="button"
            className="icon-button"
            style={{ gridArea: move.area }}
            aria-label={move.label}
            title={move.label}
            disabled={move.disabled}
            onClick={move.onClick}
          >
            <ArrowIcon rotate={move.rotate} />
          </button>
        ))}
      </div>
      <div className="adjust-zoom">
        <button
          type="button"
          className="icon-button"
          aria-label="Zoom out"
          title="Zoom out"
          disabled={crop.zoom <= 1}
          onClick={() => onCrop(zoomCrop(photo, aspect, crop, 1 / ZOOM_STEP))}
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Zoom in"
          title="Zoom in"
          disabled={crop.zoom >= MAX_ZOOM}
          onClick={() => onCrop(zoomCrop(photo, aspect, crop, ZOOM_STEP))}
        >
          <ZoomInIcon />
        </button>
        <button type="button" className="text-button" disabled={isCentered} onClick={() => onCrop(CENTERED)}>
          <ResetIcon />
          Reset
        </button>
      </div>
    </div>
  )
}
