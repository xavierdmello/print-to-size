import { describe, expect, it } from 'vitest'
import { MIN_PAGE_MARGIN, PAGE_MARGIN, layoutSheets, type Piece, type Placement } from './layout'
import { getPaper } from './paper'

const letter = getPaper('letter')
const a4 = getPaper('a4')

function pieces(count: number, width: number, height: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({ key: String(i), width, height }))
}

function overlaps(a: Placement, b: Placement): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

function expectValidPages(pages: ReturnType<typeof layoutSheets>, paper = letter, margin = PAGE_MARGIN) {
  for (const { placements } of pages) {
    for (const p of placements) {
      expect(p.x).toBeGreaterThanOrEqual(margin.x - 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(margin.y - 1e-9)
      expect(p.x + p.width).toBeLessThanOrEqual(paper.width - margin.x + 1e-9)
      expect(p.y + p.height).toBeLessThanOrEqual(paper.height - margin.y + 1e-9)
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
    expect(pages[0].placements[1].y - pages[0].placements[0].y).toBe(4)
    expectValidPages(pages)
  })

  it('fits two 4×6 photos on a Letter page, like Windows 7, and starts a new page when full', () => {
    const pages = layoutSheets(pieces(3, 6, 4), letter)
    expect(pages.map((p) => p.placements.length)).toEqual([2, 1])
    expectValidPages(pages)
  })

  it('rotates a photo only when that is what makes it fit', () => {
    const [page] = layoutSheets(pieces(1, 10, 8), letter)
    expect(page.placements[0]).toMatchObject({ width: 8, height: 10, rotated: true })
    const [upright] = layoutSheets(pieces(1, 4, 6), letter)
    expect(upright.placements[0].rotated).toBe(false)
  })

  it('turns photos when that fits more on a page', () => {
    const pages = layoutSheets(pieces(2, 5, 7), letter)
    expect(pages).toHaveLength(1)
    expect(pages[0].placements.every((p) => p.rotated)).toBe(true)
    expectValidPages(pages)
  })

  it('goes out to the printer minimum only when a photo needs it, like an 8×10 on A4', () => {
    const pages = layoutSheets([...pieces(1, 8, 10), ...pieces(2, 6, 4)], a4)
    expect(pages.map((p) => p.placements.length)).toEqual([1, 2])
    expectValidPages(pages.slice(0, 1), a4, MIN_PAGE_MARGIN)
    expectValidPages(pages.slice(1), a4)
  })

  it('puts photos edge to edge, all facing the same way on a page', () => {
    const [page] = layoutSheets(pieces(9, 2.5, 3.5), letter)
    expect(page.placements.map((p) => [p.x - page.placements[0].x, p.y - page.placements[0].y])).toEqual([
      [0, 0], [2.5, 0], [5, 0],
      [0, 3.5], [2.5, 3.5], [5, 3.5],
      [0, 7], [2.5, 7], [5, 7],
    ])
    expect(new Set(page.placements.map((p) => p.rotated)).size).toBe(1)
  })

  it.each([
    ['Letter', letter],
    ['A4', a4],
  ])('fits as many of each size on %s as Windows 7 does', (_, paper) => {
    const perSheet = (width: number, height: number) => layoutSheets(pieces(20, width, height), paper)[0].placements.length
    expect(perSheet(6, 4)).toBe(2)
    expect(perSheet(7, 5)).toBe(2)
    expect(perSheet(10, 8)).toBe(1)
    expect(perSheet(5, 3.5)).toBe(4)
    expect(perSheet(3.5, 2.5)).toBe(9)
  })

  it('keeps mixed sizes inside the margins', () => {
    const mixed = [...pieces(1, 7, 5), ...pieces(3, 4, 6), ...pieces(5, 2.5, 3.5), ...pieces(1, 10, 8)]
    expectValidPages(layoutSheets(mixed, letter))
    expectValidPages(layoutSheets(mixed, a4), a4, MIN_PAGE_MARGIN)
  })
})
