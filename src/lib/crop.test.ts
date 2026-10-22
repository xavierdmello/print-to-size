import { describe, expect, it } from 'vitest'
import {
  CENTERED,
  MAX_ZOOM,
  cropRect,
  fitRect,
  panCrop,
  printDimensions,
  zoomCrop,
} from './crop'
import { getPaper } from './paper'
import { getSize } from './sizes'

const iphone = { width: 4032, height: 3024 } // 4:3
const tallPhone = { width: 1080, height: 2160 } // 1:2
const fourBySix = getSize('4x6', getPaper('letter'))

describe('printDimensions', () => {
  it('lays the long side horizontally for wide and vertically for tall', () => {
    expect(printDimensions(fourBySix, 'wide')).toEqual({ width: 6, height: 4 })
    expect(printDimensions(fourBySix, 'tall')).toEqual({ width: 4, height: 6 })
  })
})

describe('cropRect', () => {
  it('starts with the largest centred crop', () => {
    expect(cropRect(iphone, 1.5, CENTERED)).toEqual({ x: 0, y: 168, width: 4032, height: 2688 })
    expect(cropRect(tallPhone, 1.5, CENTERED)).toEqual({ x: 0, y: 720, width: 1080, height: 720 })
    expect(cropRect(iphone, 2 / 3, CENTERED)).toEqual({ x: 1008, y: 0, width: 2016, height: 3024 })
  })

  it('keeps the crop inside the photo', () => {
    const rect = cropRect(iphone, 1.5, { zoom: 1, cx: 0, cy: 1 })
    expect(rect.x).toBe(0)
    expect(rect.y + rect.height).toBe(iphone.height)
  })

  it('shrinks the crop when zoomed in', () => {
    const rect = cropRect(iphone, 1.5, { zoom: 2, cx: 0.5, cy: 0.5 })
    expect(rect.width).toBe(2016)
    expect(rect.height).toBe(1344)
  })
})

describe('panCrop', () => {
  it('moves the crop opposite to the photo', () => {
    const moved = panCrop(iphone, 1.5, CENTERED, 0, 100)
    expect(cropRect(iphone, 1.5, moved).y).toBe(168 - 100)
  })

  it('stops at the edge of the photo', () => {
    const moved = panCrop(iphone, 1.5, CENTERED, 0, 10_000)
    expect(cropRect(iphone, 1.5, moved).y).toBe(0)
  })

  it('cannot move along an axis the crop already fills', () => {
    const moved = panCrop(iphone, 1.5, CENTERED, 500, 0)
    expect(cropRect(iphone, 1.5, moved).x).toBe(0)
  })
})

describe('zoomCrop', () => {
  it('never zooms out past the largest crop or in past the limit', () => {
    expect(zoomCrop(iphone, 1.5, CENTERED, 0.5).zoom).toBe(1)
    expect(zoomCrop(iphone, 1.5, CENTERED, 100).zoom).toBe(MAX_ZOOM)
  })
})

describe('fitRect', () => {
  it('centres the whole photo inside the box', () => {
    expect(fitRect(tallPhone, { width: 4, height: 6 })).toEqual({ x: 0.5, y: 0, width: 3, height: 6 })
  })
})
