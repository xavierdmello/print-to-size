import type { Dimensions } from './crop'
import { PAGE_MARGIN } from './layout'
import type { PaperId } from './paper'

export type SizeId =
  | 'full'
  | '4x6'
  | '5x7'
  | '8x10'
  | '3.5x5'
  | '10x15'
  | '13x18'
  | '20x25'
  | '9x13'
  | 'wallet'
  | '4x4'
  | '5x5'
  | '8x8'
  | 'passport-us'
  | '10x10'
  | '13x13'
  | '20x20'
  | 'passport-eu'
  | 'custom'

export interface PrintSize {
  id: SizeId
  label: string
  /** Short side in inches. */
  short: number
  /** Long side in inches. */
  long: number
}

/** A size of the viewer's own, in inches. */
export interface CustomSize {
  short: number
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

/** Square and passport sizes, offered only behind the More sizes experiment. */
const EXTRA_SIZES_FOR: Record<PaperId, readonly SizeId[]> = {
  letter: ['4x4', '5x5', '8x8', 'passport-us'],
  a4: ['10x10', '13x13', '20x20', 'passport-eu'],
}

/** Each inch size and the metric size that takes its place on A4. */
const EQUIVALENTS: readonly [SizeId, SizeId][] = [
  ['4x6', '10x15'],
  ['5x7', '13x18'],
  ['8x10', '20x25'],
  ['3.5x5', '9x13'],
  ['4x4', '10x10'],
  ['5x5', '13x13'],
  ['8x8', '20x20'],
  ['passport-us', 'passport-eu'],
]

const CM = 1 / 2.54

const FIXED: Record<Exclude<SizeId, 'full' | 'custom'>, Omit<PrintSize, 'id'>> = {
  '4x6': { label: '4 × 6 in.', short: 4, long: 6 },
  '5x7': { label: '5 × 7 in.', short: 5, long: 7 },
  '8x10': { label: '8 × 10 in.', short: 8, long: 10 },
  '3.5x5': { label: '3½ × 5 in.', short: 3.5, long: 5 },
  '10x15': { label: '10 × 15 cm', short: 10 * CM, long: 15 * CM },
  '13x18': { label: '13 × 18 cm', short: 13 * CM, long: 18 * CM },
  '20x25': { label: '20 × 25 cm', short: 20 * CM, long: 25 * CM },
  '9x13': { label: '9 × 13 cm', short: 9 * CM, long: 13 * CM },
  wallet: { label: 'Wallet', short: 2.5, long: 3.5 },
  '4x4': { label: '4 × 4 in.', short: 4, long: 4 },
  '5x5': { label: '5 × 5 in.', short: 5, long: 5 },
  '8x8': { label: '8 × 8 in.', short: 8, long: 8 },
  'passport-us': { label: 'Passport 2 × 2 in.', short: 2, long: 2 },
  '10x10': { label: '10 × 10 cm', short: 10 * CM, long: 10 * CM },
  '13x13': { label: '13 × 13 cm', short: 13 * CM, long: 13 * CM },
  '20x20': { label: '20 × 20 cm', short: 20 * CM, long: 20 * CM },
  'passport-eu': { label: 'Passport 35 × 45 mm', short: 3.5 * CM, long: 4.5 * CM },
}

/** The smallest custom size that's still practical to cut out. */
export const MIN_CUSTOM = 1
export const DEFAULT_CUSTOM: CustomSize = { short: 4, long: 6 }

/** The sizes shown for a paper: the standard ones, then the square and passport ones if asked for. */
export function sizesFor(paperId: PaperId, options: { extras?: boolean } = {}): readonly SizeId[] {
  return options.extras ? [...SIZES_FOR[paperId], ...EXTRA_SIZES_FOR[paperId]] : SIZES_FOR[paperId]
}

export function defaultSizeFor(paperId: PaperId): SizeId {
  return SIZES_FOR[paperId][1]
}

/** The size to use on `paperId`: the same one if it belongs there, otherwise its counterpart. */
export function sizeForPaper(id: SizeId, paperId: PaperId): SizeId {
  if (id === 'full' || id === 'custom' || id === 'wallet') return id
  const own = [...SIZES_FOR[paperId], ...EXTRA_SIZES_FOR[paperId]]
  if (own.includes(id)) return id
  const pair = EQUIVALENTS.find((sizes) => sizes.includes(id))
  return pair?.find((size) => own.includes(size)) ?? defaultSizeFor(paperId)
}

/** The largest short and long sides that fit on the paper inside the margin. */
export function largestSize(paper: Dimensions): CustomSize {
  return { short: paper.width - 2 * PAGE_MARGIN, long: paper.height - 2 * PAGE_MARGIN }
}

/**
 * A full page photo covers as much of the paper as a home printer can reach. A custom
 * size is kept between the smallest practical size and the largest that fits the paper.
 */
export function getSize(id: SizeId, paper: Dimensions, custom: CustomSize = DEFAULT_CUSTOM): PrintSize {
  if (id === 'full') return { id, label: 'Full page photo', ...largestSize(paper) }
  if (id === 'custom') {
    const largest = largestSize(paper)
    const short = Math.min(Math.max(custom.short, MIN_CUSTOM), largest.short)
    const long = Math.min(Math.max(custom.long, short), largest.long)
    return { id, label: 'Custom', short, long }
  }
  return { id, ...FIXED[id] }
}

export function isSizeId(value: unknown): value is SizeId {
  return value === 'full' || value === 'custom' || (typeof value === 'string' && Object.hasOwn(FIXED, value))
}
