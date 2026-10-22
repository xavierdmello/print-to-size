/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see docs/development.md, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Which sizes the list offers under the "Sizes" switches.
 */
import type { Paper } from '../../lib/paper'
import { getSize, sizesFor, type PrintSize, type SizeId } from '../../lib/sizes'
import type { PrintItem } from '../../state'
import type { DevFlags } from '../flags'

/**
 * The standard sizes, plus square and passport ones and Custom size when their switches are on.
 * The selected photo's own size is always listed, even if its switch has since been
 * turned off or it came from dragging an edge, so the list never loses the selection.
 */
export function visibleSizes(flags: DevFlags, paper: Paper, item: PrintItem | null): SizeId[] {
  const ids: SizeId[] = [...sizesFor(paper.id, { extras: flags.moreSizes })]
  if (flags.customSize) ids.push('custom')
  if (item && !ids.includes(item.sizeId)) ids.push(item.sizeId)
  return ids
}

/** Sizes a dragged edge can land on: everything listed except Custom size. */
export function snapTargets(flags: DevFlags, paper: Paper, item: PrintItem | null): PrintSize[] {
  return visibleSizes(flags, paper, item)
    .filter((id) => id !== 'custom')
    .map((id) => getSize(id, paper))
}

