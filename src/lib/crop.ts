import type { PrintSize } from './sizes'

export type Shape = 'wide' | 'tall' | 'whole'
export type CropShape = Exclude<Shape, 'whole'>

export interface Dimensions {
  width: number
  height: number
}

export interface Rect extends Dimensions {
  x: number
  y: number
}

/**
 * Where the crop sits on the photo. `cx`/`cy` are the crop's centre as a
 * fraction of the photo's width/height; `zoom` 1 is the largest crop that fits.
 */
export interface Crop {
  zoom: number
  cx: number
  cy: number
}

export const MAX_ZOOM = 4
export const CENTERED: Crop = { zoom: 1, cx: 0.5, cy: 0.5 }

export function naturalShape(image: Dimensions): CropShape {
  return image.width >= image.height ? 'wide' : 'tall'
}

/** Printed size in inches. A whole photo uses the frame orientation that matches it. */
export function printDimensions(size: PrintSize, shape: Shape, image: Dimensions): Dimensions {
  const orientation = shape === 'whole' ? naturalShape(image) : shape
  return orientation === 'wide'
    ? { width: size.long, height: size.short }
    : { width: size.short, height: size.long }
}

function cropSize(image: Dimensions, aspect: number, zoom: number): Dimensions {
  const width = image.width / image.height > aspect ? image.height * aspect : image.width
  return { width: width / zoom, height: width / aspect / zoom }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clampCrop(image: Dimensions, aspect: number, crop: Crop): Crop {
  const zoom = clamp(crop.zoom, 1, MAX_ZOOM)
  const { width, height } = cropSize(image, aspect, zoom)
  const halfX = width / 2 / image.width
  const halfY = height / 2 / image.height
  return {
    zoom,
    cx: clamp(crop.cx, halfX, 1 - halfX),
    cy: clamp(crop.cy, halfY, 1 - halfY),
  }
}

/** The cropped area in photo pixels. */
export function cropRect(image: Dimensions, aspect: number, crop: Crop): Rect {
  const clamped = clampCrop(image, aspect, crop)
  const { width, height } = cropSize(image, aspect, clamped.zoom)
  return {
    x: clamped.cx * image.width - width / 2,
    y: clamped.cy * image.height - height / 2,
    width,
    height,
  }
}

/** Moves the photo by (dx, dy) photo pixels; positive values move it right and down. */
export function panCrop(image: Dimensions, aspect: number, crop: Crop, dx: number, dy: number): Crop {
  return clampCrop(image, aspect, {
    ...crop,
    cx: crop.cx - dx / image.width,
    cy: crop.cy - dy / image.height,
  })
}

export function zoomCrop(image: Dimensions, aspect: number, crop: Crop, factor: number): Crop {
  return clampCrop(image, aspect, { ...crop, zoom: crop.zoom * factor })
}

/** The largest rect with the photo's proportions that fits inside `box`, centred. */
export function fitRect(image: Dimensions, box: Dimensions): Rect {
  const scale = Math.min(box.width / image.width, box.height / image.height)
  const width = image.width * scale
  const height = image.height * scale
  return { x: (box.width - width) / 2, y: (box.height - height) / 2, width, height }
}

/** Photo pixels per printed inch. */
export function effectiveDpi(image: Dimensions, size: PrintSize, shape: Shape, crop: Crop): number {
  const print = printDimensions(size, shape, image)
  if (shape === 'whole') {
    return Math.min(image.width / print.width, image.height / print.height)
  }
  return cropRect(image, print.width / print.height, crop).width / print.width
}
