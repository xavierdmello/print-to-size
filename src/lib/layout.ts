import type { Dimensions, Rect } from './crop'

export interface Piece extends Dimensions {
  key: string
}

/** A piece on the page, in inches from the page's top-left corner. Width and height are as printed. */
export interface Placement extends Rect {
  key: string
  /** Turned a quarter turn on the page because it only fits that way. */
  rotated: boolean
}

/** One printed page, turned whichever way suits its photos. Sizes are in inches. */
export interface SheetPage extends Dimensions {
  landscape: boolean
  placements: Placement[]
}

/** Space kept around the edge of the page: about what home photo printers can reach (3 mm). */
export const PAGE_MARGIN = 0.125
/** Thin space between photos, as in the Windows 7 Print Pictures layouts. */
export const PIECE_GAP = 0.1

/** Rounding slack, so a layout that fits exactly isn't rejected. */
const EPSILON = 1e-9

interface Shelf {
  y: number
  height: number
  right: number
}

interface Candidate {
  page: Dimensions & { landscape: boolean }
  placements: Placement[]
}

function oriented(piece: Dimensions, turned: boolean): Dimensions {
  return turned ? { width: piece.height, height: piece.width } : { width: piece.width, height: piece.height }
}

function fitsIn(size: Dimensions, area: Dimensions): boolean {
  return size.width <= area.width + EPSILON && size.height <= area.height + EPSILON
}

function pageShapes(paper: Dimensions) {
  return [
    { width: paper.width, height: paper.height, landscape: false },
    { width: paper.height, height: paper.width, landscape: true },
  ]
}

function printable(page: Dimensions): Dimensions {
  return { width: page.width - 2 * PAGE_MARGIN, height: page.height - 2 * PAGE_MARGIN }
}

/**
 * Lays pieces out the way the Windows 7 Print Pictures dialog does: in rows with a thin
 * gap, every photo on a page facing the same way, on as few pages as possible, in order.
 * Each page is turned portrait or landscape to fit the most photos; among layouts that fit
 * as many, it prefers photos upright, then the most even space around them. Each page's
 * arrangement is centred.
 */
export function layoutSheets(pieces: readonly Piece[], paper: Dimensions): SheetPage[] {
  const area = printable(paper)
  for (const piece of pieces) {
    if (!fitsIn(piece, area) && !fitsIn(oriented(piece, true), area)) {
      throw new Error(`A ${piece.width}×${piece.height} in photo does not fit on the paper`)
    }
  }

  const pages: SheetPage[] = []
  let next = 0
  while (next < pieces.length) {
    const { page, placements } = bestPage(pieces, next, paper)
    pages.push({ ...page, placements: centre(placements, page) })
    next += placements.length
  }
  return pages
}

function bestPage(pieces: readonly Piece[], start: number, paper: Dimensions): Candidate {
  const candidates = pageShapes(paper).flatMap((page) =>
    [false, true].map((turned) => ({ page, placements: packPage(pieces, start, printable(page), turned) })),
  )
  return candidates.reduce((best, candidate) => (better(candidate, best) ? candidate : best))
}

function better(a: Candidate, b: Candidate): boolean {
  if (a.placements.length !== b.placements.length) return a.placements.length > b.placements.length
  const turnedA = a.placements.filter((p) => p.rotated).length
  const turnedB = b.placements.filter((p) => p.rotated).length
  if (turnedA !== turnedB) return turnedA < turnedB
  return smallestMargin(a) > smallestMargin(b) + EPSILON
}

/** The narrowest space left between the arrangement and the page edge once it's centred. */
function smallestMargin({ page, placements }: Candidate): number {
  if (placements.length === 0) return -Infinity
  const { width, height } = bounds(placements)
  return Math.min(page.width - width, page.height - height) / 2
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
  if (last) {
    const x = last.right + PIECE_GAP
    if (x + size.width <= area.width + EPSILON && last.y + size.height <= area.height + EPSILON) {
      last.right = x + size.width
      last.height = Math.max(last.height, size.height)
      return { key: piece.key, x, y: last.y, ...size, rotated }
    }
  }

  // On a new row.
  const y = last ? last.y + last.height + PIECE_GAP : 0
  if (!fitsIn({ width: size.width, height: y + size.height }, area)) return null
  shelves.push({ y, height: size.height, right: size.width })
  return { key: piece.key, x: 0, y, ...size, rotated }
}

function bounds(placements: Placement[]): Dimensions {
  return {
    width: Math.max(...placements.map((p) => p.x + p.width)),
    height: Math.max(...placements.map((p) => p.y + p.height)),
  }
}

function centre(placements: Placement[], page: Dimensions): Placement[] {
  const { width, height } = bounds(placements)
  const dx = (page.width - width) / 2
  const dy = (page.height - height) / 2
  return placements.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
}
