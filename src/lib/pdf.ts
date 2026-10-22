import { PDFDocument, degrees, rgb } from 'pdf-lib'
import type { Dimensions } from './crop'
import type { Placement, SheetPage } from './layout'

const POINTS_PER_INCH = 72
const CUT_LINE = { color: rgb(0.55, 0.55, 0.55), width: 0.5, dash: [3, 2.5] }

/**
 * Arguments for pdf-lib's drawImage that put an image, rendered upright at the
 * piece's printed size, into `placement`. PDF coordinates start at the bottom left.
 */
export function imageDrawArgs(placement: Placement, paper: Dimensions) {
  const x = placement.x * POINTS_PER_INCH
  const y = (paper.height - placement.y - placement.height) * POINTS_PER_INCH
  const width = placement.width * POINTS_PER_INCH
  const height = placement.height * POINTS_PER_INCH
  if (!placement.rotated) return { x, y, width, height, rotate: degrees(0) }
  // Rotating 90° about the image's bottom-left corner swings it to the left of x.
  return { x: x + width, y, width: height, height: width, rotate: degrees(90) }
}

/** One PDF page per sheet. `images` maps each placement key to its JPEG. */
export async function buildPdf(
  pages: readonly SheetPage[],
  paper: Dimensions,
  images: ReadonlyMap<string, Uint8Array>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle('Photos to print')
  pdf.setCreator('Print to Frame')

  const embedded = new Map<string, Awaited<ReturnType<typeof pdf.embedJpg>>>()
  for (const [key, jpeg] of images) embedded.set(key, await pdf.embedJpg(jpeg))

  for (const sheet of pages) {
    const page = pdf.addPage([paper.width * POINTS_PER_INCH, paper.height * POINTS_PER_INCH])
    for (const placement of sheet.placements) {
      const image = embedded.get(placement.key)
      if (!image) throw new Error(`No image for ${placement.key}`)
      page.drawImage(image, imageDrawArgs(placement, paper))
      page.drawRectangle({
        x: placement.x * POINTS_PER_INCH,
        y: (paper.height - placement.y - placement.height) * POINTS_PER_INCH,
        width: placement.width * POINTS_PER_INCH,
        height: placement.height * POINTS_PER_INCH,
        borderColor: CUT_LINE.color,
        borderWidth: CUT_LINE.width,
        borderDashArray: CUT_LINE.dash,
      })
    }
  }

  return pdf.save()
}
