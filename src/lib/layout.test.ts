import { describe, expect, it } from 'vitest'
import { PAGE_MARGIN, PIECE_GAP, layoutSheets, type Piece, type SheetPage } from './layout'
import { getPaper } from './paper'

const letter = getPaper('letter')
const a4 = getPaper('a4')

function pieces(count: number, width: number, height: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({ key: String(i), width, height }))
}

function expectValidPages(pages: SheetPage[]) {
  for (const page of pages) {
    for (const [i, p] of page.placements.entries()) {
      expect(p.x).toBeGreaterThanOrEqual(PAGE_MARGIN - 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(PAGE_MARGIN - 1e-9)
      expect(p.x + p.width).toBeLessThanOrEqual(page.width - PAGE_MARGIN + 1e-9)
      expect(p.y + p.height).toBeLessThanOrEqual(page.height - PAGE_MARGIN + 1e-9)
      for (const q of page.placements.slice(i + 1)) {
        const apart =
          p.x + p.width + PIECE_GAP <= q.x + 1e-9 ||
          q.x + q.width + PIECE_GAP <= p.x + 1e-9 ||
          p.y + p.height + PIECE_GAP <= q.y + 1e-9 ||
          q.y + q.height + PIECE_GAP <= p.y + 1e-9
        expect(apart).toBe(true)
      }
    }
  }
}

describe('layoutSheets', () => {
  it.each([
    ['Letter', letter],
    ['A4', a4],
  ])('fits as many of each size on %s as Windows 7 does, wide or tall', (_, paper) => {
    const perSheet = (width: number, height: number) => layoutSheets(pieces(20, width, height), paper)[0].placements.length
    for (const [long, short, count] of [
      [6, 4, 2],
      [7, 5, 2],
      [10, 8, 1],
      [5, 3.5, 4],
      [3.5, 2.5, 9],
    ]) {
      expect(perSheet(long, short)).toBe(count)
      expect(perSheet(short, long)).toBe(count)
    }
  })

  it('turns the page, not the photos, so photos stay upright', () => {
    const pages = [
      ...layoutSheets(pieces(20, 4, 6), letter),
      ...layoutSheets(pieces(20, 6, 4), letter),
      ...layoutSheets(pieces(20, 3.5, 2.5), letter),
      ...layoutSheets(pieces(1, 10, 8), letter),
    ]
    expect(pages.flatMap((page) => page.placements).every((p) => !p.rotated)).toBe(true)
  })

  it('lays two tall 4×6s side by side on a landscape page, like Windows 7', () => {
    const [page] = layoutSheets(pieces(2, 4, 6), letter)
    expect(page).toMatchObject({ landscape: true, width: 11, height: 8.5 })
    expect(page.placements[1].x - page.placements[0].x).toBeCloseTo(4 + PIECE_GAP)
  })

  it('stacks two wide 4×6s on a portrait page', () => {
    const [page] = layoutSheets(pieces(2, 6, 4), letter)
    expect(page).toMatchObject({ landscape: false, width: 8.5, height: 11 })
    expect(page.placements[1].y - page.placements[0].y).toBeCloseTo(4 + PIECE_GAP)
  })

  it('centres a single photo on whichever page leaves the most even space around it', () => {
    const [page] = layoutSheets(pieces(1, 6, 4), letter)
    expect(page.landscape).toBe(true)
    expect(page.placements[0]).toMatchObject({ x: 2.5, y: 2.25, width: 6, height: 4 })
  })

  it('leaves a thin gap between photos, as Windows 7 does', () => {
    const [page] = layoutSheets(pieces(9, 3.5, 2.5), letter)
    const xs = [...new Set(page.placements.map((p) => p.x.toFixed(4)))].map(Number)
    expect(xs[1] - xs[0]).toBeCloseTo(3.5 + PIECE_GAP)
  })

  it('starts a new page when one is full', () => {
    const pages = layoutSheets(pieces(3, 6, 4), letter)
    expect(pages.map((p) => p.placements.length)).toEqual([2, 1])
  })

  it('keeps every photo inside the margins and apart from the others', () => {
    const mixed = [...pieces(1, 7, 5), ...pieces(3, 4, 6), ...pieces(5, 2.5, 3.5), ...pieces(1, 10, 8)]
    expectValidPages(layoutSheets(mixed, letter))
    expectValidPages(layoutSheets(mixed, a4))
  })

  it('refuses a photo larger than the paper', () => {
    expect(() => layoutSheets(pieces(1, 12, 9), letter)).toThrow('does not fit')
  })
})
