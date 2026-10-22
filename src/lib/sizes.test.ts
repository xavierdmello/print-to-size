import { describe, expect, it } from 'vitest'
import { PAGE_MARGIN, layoutSheets } from './layout'
import { getPaper } from './paper'
import { MIN_CUSTOM, getSize, isSizeId, sizeForPaper, sizesFor } from './sizes'

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

describe('extra and custom sizes', () => {
  it('adds square and passport sizes for each paper when asked', () => {
    expect(sizesFor('letter', { extras: true }).slice(-4)).toEqual(['4x4', '5x5', '8x8', 'passport-us'])
    expect(sizesFor('a4', { extras: true }).slice(-4)).toEqual(['10x10', '13x13', '20x20', 'passport-eu'])
    expect(getSize('passport-eu', a4).long * 25.4).toBeCloseTo(45)
  })

  it('swaps square and passport sizes for their counterparts too', () => {
    expect(sizeForPaper('5x5', 'a4')).toBe('13x13')
    expect(sizeForPaper('passport-eu', 'letter')).toBe('passport-us')
    expect(sizeForPaper('custom', 'a4')).toBe('custom')
  })

  it('keeps a custom size practical and on the paper', () => {
    expect(getSize('custom', letter, { short: 3, long: 5 })).toMatchObject({ short: 3, long: 5 })
    expect(getSize('custom', letter, { short: 0.2, long: 0.5 })).toMatchObject({ short: MIN_CUSTOM, long: MIN_CUSTOM })
    expect(getSize('custom', letter, { short: 20, long: 30 })).toMatchObject({ short: 8.25, long: 10.75 })
  })

  it('recognises every size it offers', () => {
    for (const id of [...sizesFor('letter', { extras: true }), ...sizesFor('a4', { extras: true }), 'custom']) {
      expect(isSizeId(id)).toBe(true)
    }
    expect(isSizeId('6x9')).toBe(false)
  })
})

