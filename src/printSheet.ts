import { layoutSheets } from './lib/layout'
import { getPaper, type PaperId } from './lib/paper'
import { buildPdf } from './lib/pdf'
import { renderPrint } from './lib/render'
import { getSize } from './lib/sizes'
import { itemCrop, sheetPieces, type PrintItem } from './state'

export async function makeSheetPdf(items: readonly PrintItem[], paperId: PaperId): Promise<Uint8Array> {
  const paper = getPaper(paperId)
  const pages = layoutSheets(sheetPieces(items), paper)
  const images = new Map<string, Uint8Array>()
  for (const item of items) {
    images.set(
      item.id,
      await renderPrint(item.photo.bitmap, item.photo, getSize(item.sizeId), item.shape, itemCrop(item)),
    )
  }
  return buildPdf(pages, paper, images)
}

export function pdfFilename(items: readonly PrintItem[]): string {
  if (items.length !== 1) return 'photos.pdf'
  const base = items[0].photo.name.replace(/\.[^.]+$/, '') || 'photo'
  return `${base}-${items[0].sizeId}.pdf`
}
