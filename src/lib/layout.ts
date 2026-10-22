import type { Dimensions, Rect } from './crop'

export interface Piece extends Dimensions {
  key: string
}

/** A piece on the page, in inches from the page's top-left corner. Width and height are as printed. */
export interface Placement extends Rect {
  key: string
  rotated: boolean
}

export interface SheetPage {
  placements: Placement[]
}

/** Closest to the edges most home printers can print: about 3 mm at the sides, 5 mm top and bottom. */
export const PAGE_MARGIN = { x: 0.12, y: 0.2 }
/** Space between photos, so each can be cut out cleanly. */
export const PIECE_GAP = 0.25

interface Shelf {
  y: number
  height: number
  right: number
}

interface Orientation extends Dimensions {
  rotated: boolean
}

function orientations(piece: Piece, area: Dimensions, preferRotated: boolean): Orientation[] {
  const upright = { width: piece.width, height: piece.height, rotated: false }
  const turned = { width: piece.height, height: piece.width, rotated: true }
  return (preferRotated ? [turned, upright] : [upright, turned]).filter(
    (o) => o.width <= area.width + 1e-9 && o.height <= area.height + 1e-9,
  )
}

/**
 * Arranges pieces on as few portrait pages as a simple shelf packing allows,
 * keeping their order. Each page is packed both upright-first and turned-first,
 * and whichever fits more photos wins, so photos are only turned when that saves
 * paper. Each page's arrangement is centred on the paper.
 */
export function layoutSheets(pieces: readonly Piece[], paper: Dimensions): SheetPage[] {
  const area = { width: paper.width - 2 * PAGE_MARGIN.x, height: paper.height - 2 * PAGE_MARGIN.y }
  for (const piece of pieces) {
    if (orientations(piece, area, false).length === 0) {
      throw new Error(`A ${piece.width}×${piece.height} in photo does not fit on the paper`)
    }
  }

  const pages: SheetPage[] = []
  let next = 0
  while (next < pieces.length) {
    const upright = packPage(pieces, next, area, false)
    const turned = packPage(pieces, next, area, true)
    const best = turned.length > upright.length ? turned : upright
    pages.push({ placements: centre(best, paper) })
    next += best.length
  }
  return pages
}

/** Fills one page with pieces from `start` onwards, stopping at the first that doesn't fit. */
function packPage(pieces: readonly Piece[], start: number, area: Dimensions, preferRotated: boolean): Placement[] {
  const shelves: Shelf[] = []
  const placements: Placement[] = []
  for (let i = start; i < pieces.length; i++) {
    const placement = place(shelves, pieces[i], orientations(pieces[i], area, preferRotated), area)
    if (!placement) break
    placements.push(placement)
  }
  return placements
}

function place(shelves: Shelf[], piece: Piece, options: Orientation[], area: Dimensions): Placement | null {
  const last = shelves.at(-1)

  // Beside the last photo on the current row.
  if (last) {
    const x = last.right + PIECE_GAP
    const fit = options.find((o) => x + o.width <= area.width && last.y + o.height <= area.height)
    if (fit) {
      last.right = x + fit.width
      last.height = Math.max(last.height, fit.height)
      return { key: piece.key, x, y: last.y, width: fit.width, height: fit.height, rotated: fit.rotated }
    }
  }

  // On a new row.
  const y = last ? last.y + last.height + PIECE_GAP : 0
  const fit = options.find((o) => y + o.height <= area.height)
  if (!fit) return null
  shelves.push({ y, height: fit.height, right: fit.width })
  return { key: piece.key, x: 0, y, width: fit.width, height: fit.height, rotated: fit.rotated }
}

function centre(placements: Placement[], paper: Dimensions): Placement[] {
  const right = Math.max(...placements.map((p) => p.x + p.width))
  const bottom = Math.max(...placements.map((p) => p.y + p.height))
  const dx = (paper.width - right) / 2
  const dy = (paper.height - bottom) / 2
  return placements.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
}
