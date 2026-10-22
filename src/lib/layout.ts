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

/** Closest to the edge most home printers can print. */
export const PAGE_MARGIN = 0.12
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

function orientations(piece: Piece, area: Dimensions): Orientation[] {
  return [
    { width: piece.width, height: piece.height, rotated: false },
    { width: piece.height, height: piece.width, rotated: true },
  ].filter((o) => o.width <= area.width + 1e-9 && o.height <= area.height + 1e-9)
}

/**
 * Arranges pieces on as few portrait pages as a simple shelf packing allows,
 * keeping their order. Pieces are rotated only when that is what makes them fit.
 * Each page's arrangement is centred on the paper.
 */
export function layoutSheets(pieces: readonly Piece[], paper: Dimensions): SheetPage[] {
  const area = { width: paper.width - 2 * PAGE_MARGIN, height: paper.height - 2 * PAGE_MARGIN }
  const pages: { shelves: Shelf[]; placements: Placement[] }[] = []

  for (const piece of pieces) {
    const options = orientations(piece, area)
    if (options.length === 0) {
      throw new Error(`A ${piece.width}×${piece.height} in photo does not fit on the paper`)
    }
    const page = pages.at(-1)
    if (!page || !placeOnPage(page, piece, options, area)) {
      const fresh = { shelves: [], placements: [] }
      placeOnPage(fresh, piece, options, area)
      pages.push(fresh)
    }
  }

  return pages.map(({ placements }) => ({ placements: centre(placements, paper) }))
}

function placeOnPage(
  page: { shelves: Shelf[]; placements: Placement[] },
  piece: Piece,
  options: Orientation[],
  area: Dimensions,
): boolean {
  const last = page.shelves.at(-1)

  // Beside the last photo on the current row.
  if (last) {
    const x = last.right + PIECE_GAP
    const fit = options.find((o) => x + o.width <= area.width && last.y + o.height <= area.height)
    if (fit) {
      page.placements.push({ key: piece.key, x, y: last.y, width: fit.width, height: fit.height, rotated: fit.rotated })
      last.right = x + fit.width
      last.height = Math.max(last.height, fit.height)
      return true
    }
  }

  // On a new row.
  const y = last ? last.y + last.height + PIECE_GAP : 0
  const fit = options.find((o) => y + o.height <= area.height)
  if (!fit) return false
  page.shelves.push({ y, height: fit.height, right: fit.width })
  page.placements.push({ key: piece.key, x: 0, y, width: fit.width, height: fit.height, rotated: fit.rotated })
  return true
}

function centre(placements: Placement[], paper: Dimensions): Placement[] {
  const right = Math.max(...placements.map((p) => p.x + p.width))
  const bottom = Math.max(...placements.map((p) => p.y + p.height))
  const dx = (paper.width - right) / 2
  const dy = (paper.height - bottom) / 2
  return placements.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
}
