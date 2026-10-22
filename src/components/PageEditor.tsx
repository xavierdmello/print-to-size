import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { CENTERED, cropRect, panCrop, zoomCrop, type Crop, type Dimensions } from '../lib/crop'
import type { Placement, SheetPage } from '../lib/layout'
import type { Paper } from '../lib/paper'
import { itemCrop, itemDimensions, type PrintItem } from '../state'
import { PhotoCrop } from './PhotoCrop'
import { NUDGE, ZOOM_STEP, photoPlacement, screenToPhoto } from './placement'
import { useElementSize } from './useElementSize'

interface PageEditorProps {
  pages: SheetPage[]
  paper: Paper
  items: PrintItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCrop: (item: PrintItem, crop: Crop) => void
  /** Shown on the blank page when there are no photos yet. */
  empty?: ReactNode
}

const PAGE_MARGIN = 28

function fitPage(area: Dimensions, paper: Paper): Dimensions {
  const width = Math.min(area.width - PAGE_MARGIN * 2, ((area.height - PAGE_MARGIN * 2) * paper.width) / paper.height)
  return { width: Math.max(0, width), height: Math.max(0, (width * paper.height) / paper.width) }
}

/** A rotated piece is drawn upright, then turned a quarter anticlockwise, as in the PDF. */
function uprightStyle(placement: Placement): CSSProperties | undefined {
  if (!placement.rotated) return undefined
  return {
    width: `${(placement.height / placement.width) * 100}%`,
    height: `${(placement.width / placement.height) * 100}%`,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%) rotate(-90deg)',
  }
}

/** The printed page, where the selected photo can be dragged, pinched or nudged inside its space. */
export function PageEditor({ pages, paper, items, selectedId, onSelect, onCrop, empty }: PageEditorProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const area = useElementSize(areaRef)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const [panning, setPanning] = useState(false)
  // Paging by hand holds until the selection changes; then the selected photo's page shows.
  const [paged, setPaged] = useState<{ selectedId: string | null; index: number } | null>(null)

  const selected = items.find((item) => item.id === selectedId) ?? null
  const byId = new Map(items.map((item) => [item.id, item]))
  const page = area ? fitPage(area, paper) : null
  const pxPerInch = page ? page.width / paper.width : 0

  const selectedPage = pages.findIndex((p) => p.placements.some((placement) => placement.key === selectedId))
  const pageIndex = Math.min(
    paged?.selectedId === selectedId ? paged.index : Math.max(0, selectedPage),
    Math.max(0, pages.length - 1),
  )
  const current = pages[pageIndex]
  const showPage = (index: number) => setPaged({ selectedId, index })

  const editable = selected !== null && selected.shape !== 'whole'
  const selectedPlacement = current?.placements.find((placement) => placement.key === selectedId)

  function pan(dxScreen: number, dyScreen: number) {
    if (!selected || !editable || !selectedPlacement) return
    const print = itemDimensions(selected, paper)
    const aspect = print.width / print.height
    const crop = itemCrop(selected)
    const [dx, dy] = screenToPhoto(dxScreen, dyScreen, selectedPlacement.rotated)
    const scale = cropRect(selected.photo, aspect, crop).width / (print.width * pxPerInch)
    onCrop(selected, panCrop(selected.photo, aspect, crop, dx * scale, dy * scale))
  }

  function zoom(factor: number) {
    if (!selected || !editable) return
    const print = itemDimensions(selected, paper)
    onCrop(selected, zoomCrop(selected.photo, print.width / print.height, itemCrop(selected), factor))
  }

  const onWheel = useEffectEvent((event: WheelEvent) => {
    if (!editable || !(event.target instanceof Element) || !event.target.closest('.page-piece.is-selected')) return
    event.preventDefault()
    // Trackpad pinches arrive as wheel events with ctrlKey set and small deltas.
    zoom(Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015)))
  })

  const hasPage = page !== null
  useEffect(() => {
    const element = pageRef.current
    if (!element) return
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [hasPage])

  function onPointerDown(event: PointerEvent<HTMLDivElement>, item: PrintItem) {
    if (item.id !== selectedId) {
      onSelect(item.id)
      return
    }
    if (!editable) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    setPanning(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const now = { x: event.clientX, y: event.clientY }
    if (pointers.current.size === 1) {
      pan(now.x - previous.x, now.y - previous.y)
    } else {
      const [other] = [...pointers.current].filter(([id]) => id !== event.pointerId).map(([, p]) => p)
      const before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(now.x - other.x, now.y - other.y)
      if (before > 0) zoom(after / before)
    }
    pointers.current.set(event.pointerId, now)
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size === 0) setPanning(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!selected || !editable || !selectedPlacement) return
    const step = (selectedPlacement.rotated ? selectedPlacement.height : selectedPlacement.width) * pxPerInch * NUDGE
    // Arrow keys move the crop over the photo, so the photo itself moves the other way.
    const keys: Record<string, () => void> = {
      ArrowLeft: () => pan(step, 0),
      ArrowRight: () => pan(-step, 0),
      ArrowUp: () => pan(0, step),
      ArrowDown: () => pan(0, -step),
      '+': () => zoom(ZOOM_STEP),
      '=': () => zoom(ZOOM_STEP),
      '-': () => zoom(1 / ZOOM_STEP),
      '0': () => onCrop(selected, CENTERED),
    }
    const action = keys[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
  }

  return (
    <div className="page-area" ref={areaRef}>
      {page && (
        <div
          ref={pageRef}
          className="page"
          style={{ width: page.width, height: page.height }}
          tabIndex={editable ? 0 : -1}
          aria-label={editable ? 'Page. Drag the selected photo, or use the arrow keys to move its crop and plus and minus to zoom.' : 'Page'}
          onKeyDown={onKeyDown}
        >
          {!current && empty}
          {current?.placements.map((placement, index) => {
            const item = byId.get(placement.key)
            if (!item) return null
            const isSelected = item.id === selectedId
            const print = itemDimensions(item, paper)
            const crop = itemCrop(item)
            const ghost = isSelected && panning && item.shape !== 'whole'
            return (
              <div
                key={`${placement.key}-${index}`}
                className={['page-piece', isSelected && 'is-selected', isSelected && editable && 'is-editable']
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: placement.x * pxPerInch,
                  top: placement.y * pxPerInch,
                  width: placement.width * pxPerInch,
                  height: placement.height * pxPerInch,
                }}
                onPointerDown={(event) => onPointerDown(event, item)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div className="page-piece-upright" style={uprightStyle(placement)}>
                  {ghost && (
                    <img
                      className="page-ghost"
                      src={item.photo.url}
                      alt=""
                      draggable={false}
                      style={photoPlacement(item.photo, cropRect(item.photo, print.width / print.height, crop))}
                    />
                  )}
                  <PhotoCrop photo={item.photo} shape={item.shape} crop={crop} print={print} />
                </div>
              </div>
            )
          })}
        </div>
      )}
      {pages.length > 1 && (
        <nav className="page-nav" aria-label="Pages">
          <button
            type="button"
            className="round-button"
            aria-label="Previous page"
            disabled={pageIndex === 0}
            onClick={() => showPage(pageIndex - 1)}
          >
            ‹
          </button>
          <span>
            {pageIndex + 1} of {pages.length} pages
          </span>
          <button
            type="button"
            className="round-button"
            aria-label="Next page"
            disabled={pageIndex >= pages.length - 1}
            onClick={() => showPage(pageIndex + 1)}
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
