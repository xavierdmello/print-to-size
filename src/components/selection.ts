import type { Dimensions } from '../lib/crop'
import type { PrintItem } from '../state'

/** The selected photo as an editor shows it, for anything drawn on top of it. */
export interface Selection {
  item: PrintItem
  /** Its printed size in inches, as it sits on the page. */
  print: Dimensions
  /** Its size on screen in pixels. */
  box: Dimensions
  pxPerInch: number
  /** Whether the photo can be moved inside its frame. */
  editable: boolean
  /** Whether this editor can show it at a different printed size while it's being resized. */
  resizable: boolean
}
