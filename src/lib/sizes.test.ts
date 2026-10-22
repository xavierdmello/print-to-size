import { describe, expect, it } from 'vitest'
import { PAGE_MARGIN, layoutSheets } from './layout'
import { getPaper } from './paper'
import { getSize } from './sizes'

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
