import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { layoutSheets } from './layout'
import { getPaper } from './paper'
import { buildPdf, imageDrawArgs } from './pdf'

const letter = getPaper('letter')

// A 6×4 pixel JPEG.
const JPEG = Uint8Array.from(
  atob(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAEAAYDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwC5RRRXxx9mf//Z',
  ),
  (c) => c.charCodeAt(0),
)

describe('imageDrawArgs', () => {
  it('converts a placement to PDF points from the page\'s bottom-left corner', () => {
    const [page] = layoutSheets([{ key: 'a', width: 6, height: 4 }], letter)
    const args = imageDrawArgs(page.placements[0], page)
    expect(args).toMatchObject({ x: 180, y: 162, width: 432, height: 288 })
    expect(args.rotate.angle).toBe(0)
  })

  it('draws a turned photo so it covers the same rectangle', () => {
    const page = { width: 8.5, height: 11 }
    const placement = { key: 'a', x: 0.25, y: 0.5, width: 8, height: 10, rotated: true }
    const args = imageDrawArgs(placement, page)
    expect(args.rotate.angle).toBe(90)
    expect(args).toMatchObject({ width: 720, height: 576 })
    // After a 90° turn the image spans [x - height, x] horizontally and [y, y + width] vertically.
    expect(args.x - args.height).toBeCloseTo(placement.x * 72)
    expect(args.y + args.width).toBeCloseTo((page.height - placement.y) * 72)
  })
})

describe('buildPdf', () => {
  it('makes one page per sheet, each the way it was turned', async () => {
    const pages = layoutSheets(
      [1, 2, 3].map((n) => ({ key: `p${n}`, width: 6, height: 4 })),
      letter,
    )
    const images = new Map(pages.flatMap((p) => p.placements).map((p) => [p.key, JPEG]))
    const pdf = await PDFDocument.load(await buildPdf(pages, images))
    expect(pdf.getPageCount()).toBe(2)
    expect(pdf.getPage(0).getSize()).toEqual({ width: 612, height: 792 })
    expect(pdf.getPage(1).getSize()).toEqual({ width: 792, height: 612 })
  })

  it('fails loudly when an image is missing', async () => {
    const pages = layoutSheets([{ key: 'a', width: 6, height: 4 }], letter)
    await expect(buildPdf(pages, new Map())).rejects.toThrow('No image for a')
  })
})
