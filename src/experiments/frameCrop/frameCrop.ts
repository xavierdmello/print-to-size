/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 */
import type { DevFlags } from '../flags'

/** Extra props for the crop editor that turn it into a framed picture on a wall. */
export function frameCropProps(flags: DevFlags): { className?: string; room?: number } {
  if (!flags.frameCrop) return {}
  return { className: `experiment-frame-crop frame-${flags.frameStyle}`, room: 0.16 }
}
