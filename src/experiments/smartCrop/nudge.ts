/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see docs/development.md, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * The rule: keep the largest centred crop, and move it (never zoom) only as far as needed to
 * stop it cutting through a face. If that can't be done for every face, keep as many of the
 * biggest faces whole as fit. Never return a crop that cuts more faces than the centred one.
 */
import { clampCrop, cropRect, type Crop, type Dimensions, type Rect } from '../../lib/crop'

/** Faces smaller than this share of the photo's short side are background and ignored. */
export const MIN_FACE_SHARE = 0.04

/** Room kept around a detected face box, as a share of its size, so hair and chins stay in. */
const PADDING = { top: 0.6, side: 0.25, bottom: 0.35 }

export type Face = Rect

function pad(face: Face, image: Dimensions): Rect {
  const x = Math.max(0, face.x - face.width * PADDING.side)
  const y = Math.max(0, face.y - face.height * PADDING.top)
  const right = Math.min(image.width, face.x + face.width * (1 + PADDING.side))
  const bottom = Math.min(image.height, face.y + face.height * (1 + PADDING.bottom))
  return { x, y, width: right - x, height: bottom - y }
}

function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x))
  const y = Math.min(...rects.map((r) => r.y))
  const right = Math.max(...rects.map((r) => r.x + r.width))
  const bottom = Math.max(...rects.map((r) => r.y + r.height))
  return { x, y, width: right - x, height: bottom - y }
}

function cuts(rect: Rect, face: Rect): boolean {
  const overlapsX = face.x < rect.x + rect.width && rect.x < face.x + face.width
  const overlapsY = face.y < rect.y + rect.height && rect.y < face.y + face.height
  const inside =
    face.x >= rect.x - 0.5 &&
    face.y >= rect.y - 0.5 &&
    face.x + face.width <= rect.x + rect.width + 0.5 &&
    face.y + face.height <= rect.y + rect.height + 0.5
  return overlapsX && overlapsY && !inside
}

function fits(target: Rect, rect: Rect): boolean {
  return target.width <= rect.width + 0.5 && target.height <= rect.height + 0.5
}

/** Slides `start` along one axis by the least amount that brings [from, to] inside a span of `length`. */
function slide(start: number, length: number, from: number, to: number): number {
  if (from < start) return from
  if (to > start + length) return to - length
  return start
}

export function nudgeForFaces(image: Dimensions, aspect: number, crop: Crop, faces: readonly Face[]): Crop {
  const minimum = MIN_FACE_SHARE * Math.min(image.width, image.height)
  const padded = faces
    .filter((face) => face.height >= minimum)
    .map((face) => pad(face, image))
    .sort((a, b) => b.width * b.height - a.width * a.height)
  if (padded.length === 0) return crop

  const rect = cropRect(image, aspect, crop)

  // Keep the biggest faces that can all fit in the crop together.
  const keep: Rect[] = []
  for (const face of padded) {
    if (fits(union([...keep, face]), rect)) keep.push(face)
  }
  if (keep.length === 0) return crop
  const target = union(keep)

  const x = slide(rect.x, rect.width, target.x, target.x + target.width)
  const y = slide(rect.y, rect.height, target.y, target.y + target.height)
  const moved = clampCrop(image, aspect, {
    zoom: crop.zoom,
    cx: (x + rect.width / 2) / image.width,
    cy: (y + rect.height / 2) / image.height,
  })

  const count = (r: Rect) => padded.filter((face) => cuts(r, face)).length
  return count(cropRect(image, aspect, moved)) < count(rect) ? moved : crop
}
