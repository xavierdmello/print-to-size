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

/** Space kept around the edge of the page, comfortably inside what any home printer can reach. */
export const PAGE_MARGIN = { x: 0.25, y: 0.25 }
/**
 * Closest to the edges most home printers can print: about 3 mm at the sides, 5 mm top and bottom.
 * Used only for a photo that won't fit inside the comfortable margin, such as a full page photo.
 */
export const MIN_PAGE_MARGIN = { x: 0.12, y: 0.2 }
/** Rounding slack, so a layout that fits exactly (three wallets across 7.5 in) isn't rejected. */
const EPSILON = 1e-9

interface Shelf {
  y: number
  height: number
  right: number
}

function oriented(piece: Piece, turned: boolean): Dimensions {
  return turned ? { width: piece.height, height: piece.width } : { width: piece.width, height: piece.height }
}

function fitsIn(size: Dimensions, area: Dimensions): boolean {
  return size.width <= area.width + EPSILON && size.height <= area.height + EPSILON
}

function printableArea(paper: Dimensions, margin: { x: number; y: number }): Dimensions {
  return { width: paper.width - 2 * margin.x, height: paper.height - 2 * margin.y }
}

/**
 * Lays pieces out the way the Windows 7 Print Pictures dialog does: edge to edge in
 * rows, every photo on a page facing the same way, as few pages as possible, in order.
 * A page is turned sideways only when that fits more photos (two 5×7s on Letter), and
 * only goes out to the printer's minimum margin when its first photo needs it. Each
 * page's arrangement is centred on the paper.
 */
export function layoutSheets(pieces: readonly Piece[], paper: Dimensions): SheetPage[] {
  const comfortable = printableArea(paper, PAGE_MARGIN)
  const minimum = printableArea(paper, MIN_PAGE_MARGIN)
  for (const piece of pieces) {
    if (!fitsIn(piece, minimum) && !fitsIn(oriented(piece, true), minimum)) {
      throw new Error(`A ${piece.width}×${piece.height} in photo does not fit on the paper`)
    }
  }

  const pages: SheetPage[] = []
  let next = 0
  while (next < pieces.length) {
    let best = bestPage(pieces, next, comfortable)
    if (best.length === 0) best = bestPage(pieces, next, minimum)
    pages.push({ placements: centre(best, paper) })
    next += best.length
  }
  return pages
}

function bestPage(pieces: readonly Piece[], start: number, area: Dimensions): Placement[] {
  const upright = packPage(pieces, start, area, false)
  const turned = packPage(pieces, start, area, true)
  return turned.length > upright.length ? turned : upright
}

/** Fills one page with pieces from `start` onwards, all facing one way, stopping at the first that doesn't fit. */
function packPage(pieces: readonly Piece[], start: number, area: Dimensions, turned: boolean): Placement[] {
  const shelves: Shelf[] = []
  const placements: Placement[] = []
  for (let i = start; i < pieces.length; i++) {
    const placement = place(shelves, pieces[i], oriented(pieces[i], turned), turned, area)
    if (!placement) break
    placements.push(placement)
  }
  return placements
}

function place(shelves: Shelf[], piece: Piece, size: Dimensions, rotated: boolean, area: Dimensions): Placement | null {
  const last = shelves.at(-1)

  // Beside the last photo on the current row.
  if (last && last.right + size.width <= area.width + EPSILON && last.y + size.height <= area.height + EPSILON) {
    const x = last.right
    last.right += size.width
    last.height = Math.max(last.height, size.height)
    return { key: piece.key, x, y: last.y, ...size, rotated }
  }

  // On a new row.
  const y = last ? last.y + last.height : 0
  if (!fitsIn({ width: size.width, height: y + size.height }, area)) return null
  shelves.push({ y, height: size.height, right: size.width })
  return { key: piece.key, x: 0, y, ...size, rotated }
}

function centre(placements: Placement[], paper: Dimensions): Placement[] {
  const right = Math.max(...placements.map((p) => p.x + p.width))
  const bottom = Math.max(...placements.map((p) => p.y + p.height))
  const dx = (paper.width - right) / 2
  const dy = (paper.height - bottom) / 2
  return placements.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
}
