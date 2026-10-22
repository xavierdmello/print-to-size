import { describe, expect, it } from 'vitest'
import { PAGE_MARGIN, PIECE_GAP, layoutSheets, type Piece, type Placement } from './layout'
import { getPaper } from './paper'

const letter = getPaper('letter')
const a4 = getPaper('a4')

function pieces(count: number, width: number, height: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({ key: String(i), width, height }))
}

function overlaps(a: Placement, b: Placement): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

function expectValidPages(pages: ReturnType<typeof layoutSheets>, paper = letter) {
  for (const { placements } of pages) {
    for (const p of placements) {
      expect(p.x).toBeGreaterThanOrEqual(PAGE_MARGIN - 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(PAGE_MARGIN - 1e-9)
      expect(p.x + p.width).toBeLessThanOrEqual(paper.width - PAGE_MARGIN + 1e-9)
      expect(p.y + p.height).toBeLessThanOrEqual(paper.height - PAGE_MARGIN + 1e-9)
    }
    placements.forEach((a, i) =>
      placements.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)),
    )
  }
}

describe('layoutSheets', () => {
  it('centres a single photo on the page at its true size', () => {
    const [page] = layoutSheets(pieces(1, 6, 4), letter)
    expect(page.placements).toEqual([{ key: '0', x: 1.25, y: 3.5, width: 6, height: 4, rotated: false }])
  })

  it('fits two 4×6 photos on one Letter page', () => {
    const pages = layoutSheets(pieces(2, 6, 4), letter)
    expect(pages).toHaveLength(1)
    expect(pages[0].placements[1].y - pages[0].placements[0].y).toBe(4 + PIECE_GAP)
    expectValidPages(pages)
  })

  it('starts a new page when one is full', () => {
    const pages = layoutSheets(pieces(3, 6, 4), letter)
    expect(pages.map((p) => p.placements.length)).toEqual([2, 1])
  })

  it('rotates a photo only when that is what makes it fit', () => {
    const [page] = layoutSheets(pieces(1, 10, 8), letter)
    expect(page.placements[0]).toMatchObject({ width: 8, height: 10, rotated: true })
    const [upright] = layoutSheets(pieces(1, 4, 6), letter)
    expect(upright.placements[0].rotated).toBe(false)
  })

  it('fits an 8×10 on A4', () => {
    const pages = layoutSheets(pieces(1, 8, 10), a4)
    expect(pages).toHaveLength(1)
    expectValidPages(pages, a4)
  })

  it('packs wallet photos densely without overlapping', () => {
    const pages = layoutSheets(pieces(16, 2.5, 3.5), letter)
    expect(pages[0].placements.length).toBe(8)
    expectValidPages(pages)
  })

  it('keeps mixed sizes inside the margins', () => {
    const mixed = [...pieces(1, 7, 5), ...pieces(3, 4, 6), ...pieces(5, 2.5, 3.5), ...pieces(1, 10, 8)]
    expectValidPages(layoutSheets(mixed, letter))
    expectValidPages(layoutSheets(mixed, a4), a4)
  })
})
