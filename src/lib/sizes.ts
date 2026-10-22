import type { Dimensions } from './crop'
import { PAGE_MARGIN } from './layout'

export type SizeId = 'full' | '4x6' | '5x7' | '8x10' | '3.5x5' | 'wallet'

export interface PrintSize {
  id: SizeId
  label: string
  /** Short side in inches. */
  short: number
  /** Long side in inches. */
  long: number
}

/** In the order they're offered, as in the Windows 7 Print Pictures dialog. */
export const SIZE_IDS: readonly SizeId[] = ['full', '4x6', '5x7', '8x10', '3.5x5', 'wallet']

const FIXED: Record<Exclude<SizeId, 'full'>, Omit<PrintSize, 'id'>> = {
  '4x6': { label: '4 × 6 in.', short: 4, long: 6 },
  '5x7': { label: '5 × 7 in.', short: 5, long: 7 },
  '8x10': { label: '8 × 10 in.', short: 8, long: 10 },
  '3.5x5': { label: '3½ × 5 in.', short: 3.5, long: 5 },
  wallet: { label: 'Wallet', short: 2.5, long: 3.5 },
}

export const DEFAULT_SIZE: SizeId = '4x6'

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
  return SIZE_IDS.includes(value as SizeId)
}
