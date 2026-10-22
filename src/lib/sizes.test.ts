import { describe, expect, it } from 'vitest'
import { PAGE_MARGIN, layoutSheets } from './layout'
import { getPaper } from './paper'
import { getSize, sizeForPaper, sizesFor } from './sizes'

const letter = getPaper('letter')
const a4 = getPaper('a4')

describe('full page photo', () => {
  it('covers the paper up to the margin', () => {
    const full = getSize('full', letter)
    expect(full.short).toBeCloseTo(8.5 - 2 * PAGE_MARGIN)
    expect(full.long).toBeCloseTo(11 - 2 * PAGE_MARGIN)
    expect(getSize('full', a4).short).toBeCloseTo(a4.width - 2 * PAGE_MARGIN)
  })

  it('fills one page, portrait when tall and landscape when wide', () => {
    const full = getSize('full', letter)
    const [tall] = layoutSheets([{ key: 't', width: full.short, height: full.long }], letter)
    const [wide] = layoutSheets([{ key: 'w', width: full.long, height: full.short }], letter)
    expect(tall.landscape).toBe(false)
    expect(wide.landscape).toBe(true)
    for (const page of [tall, wide]) {
      const { x, y } = page.placements[0]
      expect([x, y].map((n) => n.toFixed(6))).toEqual([PAGE_MARGIN, PAGE_MARGIN].map((n) => n.toFixed(6)))
      expect(page.placements[0].rotated).toBe(false)
    }
  })
})

describe('sizes for each paper', () => {
  it('offers inch sizes on Letter and metric frame sizes on A4, like Windows 7', () => {
    expect(sizesFor('letter')).toEqual(['full', '4x6', '5x7', '8x10', '3.5x5', 'wallet'])
    expect(sizesFor('a4')).toEqual(['full', '10x15', '13x18', '20x25', '9x13', 'wallet'])
  })

  it('prints metric sizes at their exact size in centimetres', () => {
    const tenByFifteen = getSize('10x15', a4)
    expect(tenByFifteen.short * 2.54).toBeCloseTo(10)
    expect(tenByFifteen.long * 2.54).toBeCloseTo(15)
  })

  it('fits as many of each metric size on A4 as Windows 7 does', () => {
    const perSheet = (id: '10x15' | '13x18' | '20x25' | '9x13' | 'wallet', tall: boolean) => {
      const { short, long } = getSize(id, a4)
      const piece = { key: id, width: tall ? short : long, height: tall ? long : short }
      return layoutSheets(Array.from({ length: 20 }, () => piece), a4)[0].placements.length
    }
    for (const tall of [false, true]) {
      expect(perSheet('10x15', tall)).toBe(2)
      expect(perSheet('13x18', tall)).toBe(2)
      expect(perSheet('20x25', tall)).toBe(1)
      expect(perSheet('9x13', tall)).toBe(4)
      expect(perSheet('wallet', tall)).toBe(9)
    }
  })

  it('swaps each size for its counterpart when the paper changes', () => {
    expect(sizeForPaper('4x6', 'a4')).toBe('10x15')
    expect(sizeForPaper('9x13', 'letter')).toBe('3.5x5')
    expect(sizeForPaper('full', 'a4')).toBe('full')
    expect(sizeForPaper('wallet', 'letter')).toBe('wallet')
  })
})

