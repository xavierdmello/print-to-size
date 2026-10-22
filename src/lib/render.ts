import { cropRect, fitRect, printDimensions, type Crop, type Dimensions, type Shape } from './crop'
import type { PrintSize } from './sizes'

export const PRINT_DPI = 300
const JPEG_QUALITY = 0.92

/**
 * Renders the print upright at its printed size and returns it as a JPEG. With `fit` the
 * photo fills the frame, cropped; without it the whole photo sits inside on white.
 */
export async function renderPrint(
  source: CanvasImageSource,
  image: Dimensions,
  size: PrintSize,
  shape: Shape,
  crop: Crop,
  fit: boolean,
): Promise<Uint8Array> {
  const print = printDimensions(size, shape)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(print.width * PRINT_DPI)
  canvas.height = Math.round(print.height * PRINT_DPI)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (fit) {
    const rect = cropRect(image, print.width / print.height, crop)
    context.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height)
  } else {
    const target = fitRect(image, canvas)
    context.drawImage(source, target.x, target.y, target.width, target.height)
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob) throw new Error('Could not render the photo')
  return new Uint8Array(await blob.arrayBuffer())
}
