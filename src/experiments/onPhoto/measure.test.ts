import { describe, expect, it } from 'vitest'
import { getPaper } from '../../lib/paper'
import { getSize, sizesFor } from '../../lib/sizes'
import { formatFrame, formatLength, snapFrame } from './measure'

const letter = getPaper('letter')
const a4 = getPaper('a4')
const letterSizes = sizesFor('letter').map((id) => getSize(id, letter))
const a4Sizes = sizesFor('a4').map((id) => getSize(id, a4))

describe('formatLength', () => {
  it('writes inches with the usual fractions', () => {
    expect(formatLength(6, 'in')).toBe('6 in')
    expect(formatLength(3.5, 'in')).toBe('3½ in')
    expect(formatLength(2.25, 'in')).toBe('2¼ in')
    expect(formatLength(0.75, 'in')).toBe('¾ in')
    expect(formatLength(4.3, 'in')).toBe('4.3 in')
  })

  it('writes centimetres, whole when they are', () => {
    expect(formatLength(15 / 2.54, 'cm')).toBe('15 cm')
    expect(formatLength(3.5 / 2.54, 'cm')).toBe('3.5 cm')
  })

  it('writes a frame width first', () => {
    expect(formatFrame(5, 3.5, 'in')).toBe('5 × 3½ in')
    expect(formatFrame(10 / 2.54, 15 / 2.54, 'cm')).toBe('10 × 15 cm')
  })
})

describe('snapFrame', () => {
  it('lands on a standard size when the drag comes close', () => {
    expect(snapFrame(6.1, 3.92, letterSizes, 'in')).toMatchObject({ sizeId: '4x6', shape: 'wide', width: 6, height: 4 })
    expect(snapFrame(5.05, 7.1, letterSizes, 'in')).toMatchObject({ sizeId: '5x7', shape: 'tall', width: 5, height: 7 })
    expect(snapFrame(3.95, 5.9, a4Sizes, 'cm')).toMatchObject({ sizeId: '10x15', shape: 'tall' })
  })

  it('becomes a custom size, rounded to the paper units, between standard sizes', () => {
    const snapped = snapFrame(4.53, 3.02, letterSizes, 'in')
    expect(snapped).toMatchObject({ sizeId: 'custom', shape: 'wide' })
    expect(snapped.custom).toEqual({ short: 3, long: 4.55 })
    const metric = snapFrame(4.53, 3.02, a4Sizes, 'cm')
    expect(metric.custom!.long * 25.4).toBeCloseTo(115)
  })
})
