import { describe, expect, it } from 'vitest'
import { screenToPhoto } from './placement'

describe('screenToPhoto', () => {
  it('leaves upright photos alone', () => {
    expect(screenToPhoto(3, -2, false)).toEqual([3, -2])
  })

  it('turns movement back a quarter turn for photos shown turned anticlockwise', () => {
    // On screen, the photo's top edge faces left: moving right on screen is moving down the photo.
    const [x, y] = screenToPhoto(1, 0, true)
    expect(x).toBeCloseTo(0)
    expect(y).toBe(1)
    // Moving up on screen is moving toward the photo's right edge.
    expect(screenToPhoto(0, -1, true)).toEqual([1, 0])
  })
})
