import { describe, expect, it } from 'vitest'
import { defaultPaperFor } from './paper'

describe('defaultPaperFor', () => {
  it('picks Letter in North America and A4 elsewhere', () => {
    expect(defaultPaperFor('en-US')).toBe('letter')
    expect(defaultPaperFor('fr-CA')).toBe('letter')
    expect(defaultPaperFor('en-GB')).toBe('a4')
    expect(defaultPaperFor('de')).toBe('a4')
  })

  it('assumes the likely region when only a language is given', () => {
    expect(defaultPaperFor('en')).toBe('letter')
  })
})
