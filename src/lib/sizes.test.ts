import { describe, expect, it } from 'vitest'
import { PAGE_MARGIN, layoutSheets } from './layout'
import { getPaper } from './paper'
import { getSize } from './sizes'

const letter = getPaper('letter')
const a4 = getPaper('a4')

describe('full page photo', () => {
  it('covers the paper up to the printer margins', () => {
    const full = getSize('full', letter)
    expect(full.short).toBeCloseTo(8.5 - 2 * PAGE_MARGIN.x)
    expect(full.long).toBeCloseTo(11 - 2 * PAGE_MARGIN.y)
    expect(getSize('full', a4).short).toBeCloseTo(a4.width - 2 * PAGE_MARGIN.x)
  })

  it('fills one page whether tall or wide', () => {
    const full = getSize('full', letter)
    for (const piece of [
      { key: 'tall', width: full.short, height: full.long },
      { key: 'wide', width: full.long, height: full.short },
    ]) {
      const pages = layoutSheets([piece, piece], letter)
      expect(pages).toHaveLength(2)
      const { x, y, width, height } = pages[0].placements[0]
      expect([x, y, width, height].map((n) => n.toFixed(6))).toEqual(
        [PAGE_MARGIN.x, PAGE_MARGIN.y, full.short, full.long].map((n) => n.toFixed(6)),
      )
    }
  })
})
