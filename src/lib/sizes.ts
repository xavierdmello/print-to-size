import type { Dimensions } from './crop'
import { PAGE_MARGIN } from './layout'
import type { PaperId } from './paper'

export type SizeId = 'full' | '4x6' | '5x7' | '8x10' | '3.5x5' | '10x15' | '13x18' | '20x25' | '9x13' | 'wallet'

export interface PrintSize {
  id: SizeId
  label: string
  /** Short side in inches. */
  short: number
  /** Long side in inches. */
  long: number
}

/**
 * The sizes offered for each paper, in order. As in the Windows 7 Print Pictures dialog,
 * Letter offers inch sizes and A4 offers the metric frame sizes sold where A4 is used.
 */
const SIZES_FOR: Record<PaperId, readonly SizeId[]> = {
  letter: ['full', '4x6', '5x7', '8x10', '3.5x5', 'wallet'],
  a4: ['full', '10x15', '13x18', '20x25', '9x13', 'wallet'],
}

/** Each inch size and the metric frame size that takes its place on A4. */
const EQUIVALENTS: readonly [SizeId, SizeId][] = [
  ['4x6', '10x15'],
  ['5x7', '13x18'],
  ['8x10', '20x25'],
  ['3.5x5', '9x13'],
]

const CM = 1 / 2.54

const FIXED: Record<Exclude<SizeId, 'full'>, Omit<PrintSize, 'id'>> = {
  '4x6': { label: '4 × 6 in.', short: 4, long: 6 },
  '5x7': { label: '5 × 7 in.', short: 5, long: 7 },
  '8x10': { label: '8 × 10 in.', short: 8, long: 10 },
  '3.5x5': { label: '3½ × 5 in.', short: 3.5, long: 5 },
  '10x15': { label: '10 × 15 cm', short: 10 * CM, long: 15 * CM },
  '13x18': { label: '13 × 18 cm', short: 13 * CM, long: 18 * CM },
  '20x25': { label: '20 × 25 cm', short: 20 * CM, long: 25 * CM },
  '9x13': { label: '9 × 13 cm', short: 9 * CM, long: 13 * CM },
  wallet: { label: 'Wallet', short: 2.5, long: 3.5 },
}

export function sizesFor(paperId: PaperId): readonly SizeId[] {
  return SIZES_FOR[paperId]
}

export function defaultSizeFor(paperId: PaperId): SizeId {
  return SIZES_FOR[paperId][1]
}

/** The size to use on `paperId`: the same one if that paper offers it, otherwise its counterpart. */
export function sizeForPaper(id: SizeId, paperId: PaperId): SizeId {
  if (SIZES_FOR[paperId].includes(id)) return id
  const pair = EQUIVALENTS.find((sizes) => sizes.includes(id))
  return pair?.find((size) => SIZES_FOR[paperId].includes(size)) ?? defaultSizeFor(paperId)
}

/** A full page photo covers as much of the paper as a home printer can reach. */
export function getSize(id: SizeId, paper: Dimensions): PrintSize {
  if (id === 'full') {
    return {
      id,
      label: 'Full page photo',
      short: paper.width - 2 * PAGE_MARGIN,
      long: paper.height - 2 * PAGE_MARGIN,
    }
  }
  return { id, ...FIXED[id] }
}

export function isSizeId(value: unknown): value is SizeId {
  return value === 'full' || (typeof value === 'string' && Object.hasOwn(FIXED, value))
}
