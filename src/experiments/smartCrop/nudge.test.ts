import { describe, expect, it } from 'vitest'
import { CENTERED, cropRect } from '../../lib/crop'
import { nudgeForFaces } from './nudge'

const tall = { width: 1080, height: 1920 } // 9:16
const wide = 1.5 // a wide 4×6 crop: 1080 × 720, centred at y 600–1320

describe('nudgeForFaces', () => {
  it('leaves the crop alone when there are no faces', () => {
    expect(nudgeForFaces(tall, wide, CENTERED, [])).toBe(CENTERED)
  })

  it('leaves the crop alone when every face is already whole', () => {
    const face = { x: 450, y: 900, width: 180, height: 180 }
    expect(nudgeForFaces(tall, wide, CENTERED, [face])).toBe(CENTERED)
  })

  it('moves just far enough to stop cutting through a face', () => {
    const face = { x: 450, y: 560, width: 180, height: 180 } // padded top edge at 452
    const crop = nudgeForFaces(tall, wide, CENTERED, [face])
    const rect = cropRect(tall, wide, crop)
    expect(rect.y).toBeCloseTo(452)
    expect(crop.zoom).toBe(1)
  })

  it('ignores small background faces', () => {
    const tiny = { x: 500, y: 590, width: 30, height: 30 }
    expect(nudgeForFaces(tall, wide, CENTERED, [tiny])).toBe(CENTERED)
  })

  it('keeps the biggest faces whole when they cannot all fit', () => {
    const big = { x: 400, y: 300, width: 260, height: 260 }
    const small = { x: 450, y: 1500, width: 120, height: 120 }
    const rect = cropRect(tall, wide, nudgeForFaces(tall, wide, CENTERED, [big, small]))
    expect(rect.y).toBeLessThanOrEqual(300 - 260 * 0.6)
    expect(rect.y + rect.height).toBeGreaterThanOrEqual(300 + 260 * 1.35)
  })

  it('keeps as many faces whole as fit when they cannot all fit', () => {
    // Centred, the crop cuts the top and bottom faces; moving up keeps the top two whole.
    const faces = [
      { x: 450, y: 520, width: 160, height: 160 },
      { x: 450, y: 900, width: 160, height: 160 },
      { x: 450, y: 1260, width: 160, height: 160 },
    ]
    const rect = cropRect(tall, wide, nudgeForFaces(tall, wide, CENTERED, faces))
    expect(rect.y).toBeCloseTo(520 - 160 * 0.6)
    expect(rect.y + rect.height).toBeLessThan(1260 - 160 * 0.6)
  })

  it('stays centred when moving would only trade one cut face for another', () => {
    const top = { x: 450, y: 560, width: 180, height: 180 }
    const bottom = { x: 450, y: 1080, width: 150, height: 150 }
    expect(nudgeForFaces(tall, wide, CENTERED, [top, bottom])).toBe(CENTERED)
  })

  it('does not move along an axis the crop already fills', () => {
    const face = { x: 0, y: 560, width: 180, height: 180 }
    expect(nudgeForFaces(tall, wide, CENTERED, [face]).cx).toBe(0.5)
  })
})
