/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * A separate crop stage: the photo in a window on its own backdrop, which the frame
 * experiment dresses up as a framed picture on a wall.
 */
import { useEffect, useEffectEvent, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { CENTERED, cropRect, panCrop, zoomCrop, type Crop, type Dimensions } from '../../lib/crop'
import { itemCrop, itemDimensions, type PrintItem } from '../../state'
import { PhotoCrop } from '../../components/PhotoCrop'
import { NUDGE, ZOOM_STEP, photoPlacement } from '../../components/placement'
import { useElementSize } from '../../components/useElementSize'

interface CropEditorProps {
  item: PrintItem
  paper: Dimensions
  onCrop: (crop: Crop) => void
  className?: string
  /** Space kept around the crop, as a fraction of the stage width. */
  room?: number
}

function fitWindow(stage: Dimensions, aspect: number, room: number): Dimensions {
  const padding = Math.max(20, stage.width * room)
  const width = Math.min(stage.width - padding * 2, (stage.height - padding * 2) * aspect)
  return { width: Math.max(0, width), height: Math.max(0, width / aspect) }
}

export function CropEditor({ item, paper, onCrop, className, room = 0.07 }: CropEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const [dragging, setDragging] = useState(false)
  const stage = useElementSize(stageRef)
  const { photo } = item
  const print = itemDimensions(item, paper)
  const aspect = print.width / print.height
  const crop = itemCrop(item)
  const rect = cropRect(photo, aspect, crop)
  const frame = stage ? fitWindow(stage, aspect, room) : null
  const editable = item.fit

  function pan(dxScreen: number, dyScreen: number) {
    if (!frame) return
    const scale = rect.width / frame.width
    onCrop(panCrop(photo, aspect, crop, dxScreen * scale, dyScreen * scale))
  }

  function zoom(factor: number) {
    onCrop(zoomCrop(photo, aspect, crop, factor))
  }

  // Trackpad pinches arrive as wheel events with ctrlKey set and small deltas.
  const onWheel = useEffectEvent((event: WheelEvent) => {
    event.preventDefault()
    zoom(Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015)))
  })

  useEffect(() => {
    const element = stageRef.current
    if (!element || !editable) return
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [editable])

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!editable) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    setDragging(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const current = { x: event.clientX, y: event.clientY }

    if (pointers.current.size === 1) {
      pan(current.x - previous.x, current.y - previous.y)
    } else {
      const [other] = [...pointers.current].filter(([id]) => id !== event.pointerId).map(([, p]) => p)
      const before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(current.x - other.x, current.y - other.y)
      if (before > 0) zoom(after / before)
    }
    pointers.current.set(event.pointerId, current)
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size === 0) setDragging(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!editable || !frame) return
    const step = { x: frame.width * NUDGE, y: frame.height * NUDGE }
    const moves: Record<string, () => void> = {
      ArrowLeft: () => pan(step.x, 0),
      ArrowRight: () => pan(-step.x, 0),
      ArrowUp: () => pan(0, step.y),
      ArrowDown: () => pan(0, -step.y),
      '+': () => zoom(ZOOM_STEP),
      '=': () => zoom(ZOOM_STEP),
      '-': () => zoom(1 / ZOOM_STEP),
      '0': () => onCrop(CENTERED),
    }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      move()
    }
  }

  return (
    <div
      ref={stageRef}
      className={['crop-stage', editable && 'is-editable', dragging && 'is-panning', className].filter(Boolean).join(' ')}
      tabIndex={editable ? 0 : -1}
      role={editable ? 'application' : undefined}
      aria-label={editable ? 'Photo crop. Drag the photo, or use the arrow keys to move the crop and plus and minus to zoom.' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      {frame && (
        <div
          className="crop-window"
          // Screen pixels per printed inch, for anything drawn at a physical size around the crop.
          style={{ width: frame.width, height: frame.height, '--ppi': `${frame.width / print.width}px` } as CSSProperties}
        >
          {editable ? (
            <>
              <img className="crop-photo" src={photo.url} alt="" draggable={false} style={photoPlacement(photo, rect)} />
              <div className="crop-shade" />
            </>
          ) : (
            <PhotoCrop photo={photo} fit={false} crop={CENTERED} print={print} />
          )}
        </div>
      )}
    </div>
  )
}
