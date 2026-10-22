import { describe, expect, it } from 'vitest'
import { getPaper } from './lib/paper'
import type { Photo } from './lib/photo'
import { MAX_COPIES, reducer, sheetPieces, type AppState } from './state'

function photo(id: string, width = 4032, height = 3024): Photo {
  return { id, name: `${id}.jpg`, url: '', width, height, bitmap: {} as ImageBitmap }
}

const empty: AppState = { items: [], selectedId: null, paperId: 'letter', sizeId: '4x6' }

function withPhotos(...photos: Photo[]): AppState {
  return photos.reduce((state, p) => reducer(state, { type: 'add', photo: p }), empty)
}

describe('reducer', () => {
  it('selects a new photo and starts it in its own orientation at the last size', () => {
    const state = withPhotos(photo('a'), photo('b', 1080, 2160))
    expect(state.selectedId).toBe('b')
    expect(state.items.map((i) => [i.shape, i.sizeId])).toEqual([
      ['wide', '4x6'],
      ['tall', '4x6'],
    ])
  })

  it('makes a changed size the default for the next photo', () => {
    let state = withPhotos(photo('a'))
    state = reducer(state, { type: 'setSize', id: 'a', sizeId: '5x7' })
    state = reducer(state, { type: 'add', photo: photo('b') })
    expect(state.items[1].sizeId).toBe('5x7')
  })

  it('keeps each shape’s crop when switching between them', () => {
    let state = withPhotos(photo('a'))
    state = reducer(state, { type: 'setCrop', id: 'a', shape: 'wide', crop: { zoom: 2, cx: 0.3, cy: 0.5 } })
    state = reducer(state, { type: 'setShape', id: 'a', shape: 'tall' })
    state = reducer(state, { type: 'setShape', id: 'a', shape: 'wide' })
    expect(state.items[0].crops.wide).toEqual({ zoom: 2, cx: 0.3, cy: 0.5 })
  })

  it('selects a neighbour when the selected photo is removed', () => {
    let state = withPhotos(photo('a'), photo('b'), photo('c'))
    state = reducer(state, { type: 'select', id: 'b' })
    state = reducer(state, { type: 'remove', id: 'b' })
    expect(state.selectedId).toBe('c')
    state = reducer(state, { type: 'remove', id: 'c' })
    expect(state.selectedId).toBe('a')
    state = reducer(state, { type: 'remove', id: 'a' })
    expect(state.selectedId).toBeNull()
  })

  it('fits new photos to the frame and can switch to the whole photo', () => {
    let state = withPhotos(photo('a'))
    expect(state.items[0].fit).toBe(true)
    state = reducer(state, { type: 'setFit', id: 'a', fit: false })
    expect(state.items[0].fit).toBe(false)
  })

  it('swaps sizes for their metric counterparts when the paper changes to A4', () => {
    let state = withPhotos(photo('a'))
    state = reducer(state, { type: 'setSize', id: 'a', sizeId: '5x7' })
    state = reducer(state, { type: 'setPaper', paperId: 'a4' })
    expect([state.items[0].sizeId, state.sizeId]).toEqual(['13x18', '13x18'])
    state = reducer(state, { type: 'setPaper', paperId: 'letter' })
    expect(state.items[0].sizeId).toBe('5x7')
  })

  it('keeps copies between one and the maximum', () => {
    let state = withPhotos(photo('a'))
    state = reducer(state, { type: 'setCopies', id: 'a', copies: 0 })
    expect(state.items[0].copies).toBe(1)
    state = reducer(state, { type: 'setCopies', id: 'a', copies: 999 })
    expect(state.items[0].copies).toBe(MAX_COPIES)
  })
})

describe('sheetPieces', () => {
  it('lists every copy at its printed size', () => {
    let state = withPhotos(photo('a'), photo('b', 1080, 2160))
    state = reducer(state, { type: 'setCopies', id: 'b', copies: 2 })
    expect(sheetPieces(state.items, getPaper('letter'))).toEqual([
      { key: 'a', width: 6, height: 4 },
      { key: 'b', width: 4, height: 6 },
      { key: 'b', width: 4, height: 6 },
    ])
  })
})
