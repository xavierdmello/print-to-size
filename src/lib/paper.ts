export type PaperId = 'letter' | 'a4'

export interface Paper {
  id: PaperId
  label: string
  /** Portrait width in inches. */
  width: number
  /** Portrait height in inches. */
  height: number
}

export const PAPERS: readonly Paper[] = [
  { id: 'letter', label: 'Letter', width: 8.5, height: 11 },
  { id: 'a4', label: 'A4', width: 210 / 25.4, height: 297 / 25.4 },
]

// Countries where Letter is the everyday paper size.
const LETTER_REGIONS = new Set(['US', 'CA', 'MX', 'PH', 'CL', 'CO', 'VE', 'CR', 'GT', 'DO', 'PA', 'PR', 'SV', 'NI', 'HN'])

export function getPaper(id: PaperId): Paper {
  return PAPERS.find((paper) => paper.id === id) ?? PAPERS[0]
}

export function isPaperId(value: unknown): value is PaperId {
  return PAPERS.some((paper) => paper.id === value)
}

export function defaultPaperFor(locale: string): PaperId {
  try {
    const region = new Intl.Locale(locale).maximize().region
    return region && LETTER_REGIONS.has(region) ? 'letter' : 'a4'
  } catch {
    return 'letter'
  }
}
