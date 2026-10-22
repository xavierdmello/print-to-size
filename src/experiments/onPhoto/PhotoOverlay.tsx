/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Everything the "On the photo" and "Showing the crop" switches draw over the selected
 * photo. Each piece shows only when its own switch is on, and they're laid out so any
 * combination fits together: size marks outside the top and left edges, the wide/tall switch
 * outside the top-right corner, resize handles on the edges, the move icon in the middle and
 * the caption along the bottom.
 */
import { useRef, useState, type PointerEvent } from 'react'
import type { Selection } from '../../components/selection'
import type { DevFlags } from '../flags'
import { formatFrame, formatLength, type SnappedFrame, type Unit } from './measure'

interface PhotoOverlayProps {
  selection: Selection
  flags: DevFlags
  unit: Unit
  onToggleShape: () => void
  /** How a frame dragged to `width` × `height` inches would land. */
  previewResize: (width: number, height: number) => SnappedFrame
  commitResize: (frame: SnappedFrame) => void
}

const HANDLES: { x: -1 | 0 | 1; y: -1 | 0 | 1; cursor: string }[] = [
  { x: -1, y: -1, cursor: 'nwse-resize' },
  { x: 0, y: -1, cursor: 'ns-resize' },
  { x: 1, y: -1, cursor: 'nesw-resize' },
  { x: 1, y: 0, cursor: 'ew-resize' },
  { x: 1, y: 1, cursor: 'nwse-resize' },
  { x: 0, y: 1, cursor: 'ns-resize' },
  { x: -1, y: 1, cursor: 'nesw-resize' },
  { x: -1, y: 0, cursor: 'ew-resize' },
]

interface Drag {
  x: number
  y: number
  centreX: number
  centreY: number
}

export function PhotoOverlay({ selection, flags, unit, onToggleShape, previewResize, commitResize }: PhotoOverlayProps) {
  const overlay = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const [preview, setPreview] = useState<SnappedFrame | null>(null)
  const { print, pxPerInch, item, editable } = selection
  const shown = preview ?? print

  function startResize(event: PointerEvent<HTMLSpanElement>, x: number, y: number) {
    const bounds = overlay.current?.getBoundingClientRect()
    if (!bounds) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    // The frame grows from its centre, so the handle stays under the pointer.
    drag.current = { x, y, centreX: bounds.left + bounds.width / 2, centreY: bounds.top + bounds.height / 2 }
  }

  function moveResize(event: PointerEvent<HTMLSpanElement>) {
    const current = drag.current
    if (!current) return
    const width = current.x ? (2 * Math.abs(event.clientX - current.centreX)) / pxPerInch : print.width
    const height = current.y ? (2 * Math.abs(event.clientY - current.centreY)) / pxPerInch : print.height
    setPreview(previewResize(width, height))
  }

  function endResize(apply: boolean) {
    if (apply && drag.current && preview) commitResize(preview)
    drag.current = null
    setPreview(null)
  }

  // While resizing, the marks sit outside the outline of the new size rather than the old edges.
  const growX = ((shown.width - print.width) * pxPerInch) / 2
  const growY = ((shown.height - print.height) * pxPerInch) / 2

  return (
    <div ref={overlay} className="photo-overlay">
      {flags.sizeMarks && (
        <>
          <span className="size-mark is-top" style={{ width: shown.width * pxPerInch, marginTop: -growY }}>
            <span>{formatLength(shown.width, unit)}</span>
          </span>
          <span className="size-mark is-left" style={{ height: shown.height * pxPerInch, marginLeft: -growX }}>
            <span>{formatLength(shown.height, unit)}</span>
          </span>
        </>
      )}

      {flags.shapeSwitch && !preview && (
        <button
          type="button"
          className="shape-switch"
          aria-label={item.shape === 'wide' ? 'Make tall' : 'Make wide'}
          title={item.shape === 'wide' ? 'Make tall' : 'Make wide'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onToggleShape}
        >
          <ShapeSwitchIcon />
        </button>
      )}

      {flags.moveHint && editable && !preview && (
        <span className="move-hint" aria-hidden="true">
          <MoveIcon />
        </span>
      )}

      {flags.dragCaption && editable && !preview && <span className="drag-caption">Drag to move</span>}

      {flags.dragResize && selection.resizable && (
        <>
          {HANDLES.map((handle) => (
            <span
              key={`${handle.x},${handle.y}`}
              className="resize-handle"
              style={{ left: `${(handle.x + 1) * 50}%`, top: `${(handle.y + 1) * 50}%`, cursor: handle.cursor }}
              onPointerDown={(event) => startResize(event, handle.x, handle.y)}
              onPointerMove={moveResize}
              onPointerUp={() => endResize(true)}
              onPointerCancel={() => endResize(false)}
            />
          ))}
          {preview && (
            <span className="resize-preview" style={{ width: preview.width * pxPerInch, height: preview.height * pxPerInch }}>
              <span>{formatFrame(preview.width, preview.height, unit)}</span>
            </span>
          )}
        </>
      )}
    </div>
  )
}

function MoveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
    </svg>
  )
}

/** A tall and a wide rectangle: switches the frame, not the picture. */
function ShapeSwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="3" y="4" width="8" height="13" rx="1" />
      <rect x="9" y="12" width="12" height="8" rx="1" />
    </svg>
  )
}
