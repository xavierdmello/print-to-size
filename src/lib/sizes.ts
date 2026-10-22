export type SizeId = '4x6' | '5x7' | '8x10' | '3.5x5' | 'wallet'

export interface PrintSize {
  id: SizeId
  label: string
  /** Short side in inches. */
  short: number
  /** Long side in inches. */
  long: number
}

export const SIZES: readonly PrintSize[] = [
  { id: '4x6', label: '4 × 6', short: 4, long: 6 },
  { id: '5x7', label: '5 × 7', short: 5, long: 7 },
  { id: '8x10', label: '8 × 10', short: 8, long: 10 },
  { id: '3.5x5', label: '3½ × 5', short: 3.5, long: 5 },
  { id: 'wallet', label: 'Wallet', short: 2.5, long: 3.5 },
]

export const DEFAULT_SIZE: SizeId = '4x6'

export function getSize(id: SizeId): PrintSize {
  return SIZES.find((size) => size.id === id) ?? SIZES[0]
}

export function isSizeId(value: unknown): value is SizeId {
  return SIZES.some((size) => size.id === value)
}
