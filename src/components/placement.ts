import type { CSSProperties } from 'react'
import { fitRect, type Dimensions, type Rect } from '../lib/crop'

/** How far one arrow press moves the photo, as a fraction of the crop. */
export const NUDGE = 0.06
/** How much one zoom step changes the crop. */
export const ZOOM_STEP = 1.2

/** Positions the photo inside its box, as percentages of the box, so `rect` fills it. */
export function photoPlacement(photo: Dimensions, rect: Rect): CSSProperties {
  return {
    left: `${(-rect.x / rect.width) * 100}%`,
    top: `${(-rect.y / rect.height) * 100}%`,
    width: `${(photo.width / rect.width) * 100}%`,
    height: `${(photo.height / rect.height) * 100}%`,
  }
}

/** Positions the whole photo, fitted and centred, inside a box with the print's proportions. */
export function wholePlacement(photo: Dimensions, print: Dimensions): CSSProperties {
  const rect = fitRect(photo, print)
  return {
    left: `${(rect.x / print.width) * 100}%`,
    top: `${(rect.y / print.height) * 100}%`,
    width: `${(rect.width / print.width) * 100}%`,
    height: `${(rect.height / print.height) * 100}%`,
  }
}
