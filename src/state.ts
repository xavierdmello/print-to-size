import { CENTERED, naturalShape, printDimensions, type Crop, type Dimensions, type Shape } from './lib/crop'
import type { Piece } from './lib/layout'
import type { PaperId } from './lib/paper'
import type { Photo } from './lib/photo'
import { getSize, type SizeId } from './lib/sizes'

export const MAX_COPIES = 24

export interface PrintItem {
  id: string
  photo: Photo
  sizeId: SizeId
  shape: Shape
  /** Fill the frame with the photo, cropped. Off puts the whole photo inside the frame on white. */
  fit: boolean
  /** Each shape keeps its own crop, so switching back and forth loses nothing. */
  crops: Record<Shape, Crop>
  copies: number
}

export interface AppState {
  items: PrintItem[]
  selectedId: string | null
  paperId: PaperId
  /** The size new photos start with. */
  sizeId: SizeId
}

export type Action =
  | { type: 'add'; photo: Photo }
  | { type: 'remove'; id: string }
  | { type: 'select'; id: string }
  | { type: 'setSize'; id: string; sizeId: SizeId }
  | { type: 'setShape'; id: string; shape: Shape }
  | { type: 'setCrop'; id: string; shape: Shape; crop: Crop }
  | { type: 'setFit'; id: string; fit: boolean }
  | { type: 'setCopies'; id: string; copies: number }
  | { type: 'setPaper'; paperId: PaperId }
  | { type: 'setDefaultSize'; sizeId: SizeId }

function update(state: AppState, id: string, change: (item: PrintItem) => PrintItem): AppState {
  return { ...state, items: state.items.map((item) => (item.id === id ? change(item) : item)) }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'add': {
      const item: PrintItem = {
        id: action.photo.id,
        photo: action.photo,
        sizeId: state.sizeId,
        shape: naturalShape(action.photo),
        fit: true,
        crops: { wide: CENTERED, tall: CENTERED },
        copies: 1,
      }
      return { ...state, items: [...state.items, item], selectedId: item.id }
    }
    case 'remove': {
      const index = state.items.findIndex((item) => item.id === action.id)
      const items = state.items.filter((item) => item.id !== action.id)
      const selectedId =
        state.selectedId === action.id ? (items[Math.min(index, items.length - 1)]?.id ?? null) : state.selectedId
      return { ...state, items, selectedId }
    }
    case 'select':
      return { ...state, selectedId: action.id }
    case 'setSize':
      return { ...update(state, action.id, (item) => ({ ...item, sizeId: action.sizeId })), sizeId: action.sizeId }
    case 'setShape':
      return update(state, action.id, (item) => ({ ...item, shape: action.shape }))
    case 'setCrop':
      return update(state, action.id, (item) => ({ ...item, crops: { ...item.crops, [action.shape]: action.crop } }))
    case 'setFit':
      return update(state, action.id, (item) => ({ ...item, fit: action.fit }))
    case 'setCopies':
      return update(state, action.id, (item) => ({
        ...item,
        copies: Math.min(MAX_COPIES, Math.max(1, action.copies)),
      }))
    case 'setPaper':
      return { ...state, paperId: action.paperId }
    case 'setDefaultSize':
      return { ...state, sizeId: action.sizeId }
  }
}

export function itemCrop(item: PrintItem): Crop {
  return item.crops[item.shape]
}

export function itemDimensions(item: PrintItem, paper: Dimensions) {
  return printDimensions(getSize(item.sizeId, paper), item.shape)
}

/** Every copy of every photo, in order, keyed by its item so copies share one image. */
export function sheetPieces(items: readonly PrintItem[], paper: Dimensions): Piece[] {
  return items.flatMap((item) => {
    const { width, height } = itemDimensions(item, paper)
    return Array.from({ length: item.copies }, () => ({ key: item.id, width, height }))
  })
}
