/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Turns the dev switches into props for the editors and the size list, so the app only
 * spreads them in. With every switch off, everything here gives the editors nothing extra.
 */
import type { Dispatch } from 'react'
import type { Selection } from '../components/selection'
import type { Paper } from '../lib/paper'
import { getSize, largestSize, MIN_CUSTOM, type SizeId } from '../lib/sizes'
import type { Action, PrintItem } from '../state'
import type { DevFlags } from './flags'
import { snapFrame } from './onPhoto/measure'
import { unitFor } from './onPhoto/measure'
import { PhotoOverlay } from './onPhoto/PhotoOverlay'
import { useCropIntro } from './onPhoto/useCropIntro'
import { CustomSizeFields } from './sizes/CustomSizeFields'
import { describeSize, snapTargets, visibleSizes } from './sizes/sizeOptions'

export function useExperiments(
  flags: DevFlags,
  paper: Paper,
  items: readonly PrintItem[],
  item: PrintItem | null,
  dispatch: Dispatch<Action>,
) {
  const { introId, endIntro } = useCropIntro(items, flags.cropIntro)
  const unit = unitFor(paper.id)
  const drawsOnPhoto = flags.sizeMarks || flags.shapeSwitch || flags.dragResize

  function previewResize(width: number, height: number) {
    const largest = largestSize(paper)
    const wide = width >= height
    const clamp = (value: number, max: number) => Math.min(Math.max(value, MIN_CUSTOM), max)
    const [w, h] = wide
      ? [clamp(width, largest.long), clamp(height, largest.short)]
      : [clamp(width, largest.short), clamp(height, largest.long)]
    return snapFrame(w, h, snapTargets(flags, paper, item), unit)
  }

  const renderSelected = drawsOnPhoto
    ? (selection: Selection) => (
        <PhotoOverlay
          selection={selection}
          flags={flags}
          unit={unit}
          onToggleShape={() =>
            dispatch({ type: 'setShape', id: selection.item.id, shape: selection.item.shape === 'wide' ? 'tall' : 'wide' })
          }
          previewResize={previewResize}
          commitResize={(frame) =>
            dispatch({ type: 'setFrame', id: selection.item.id, sizeId: frame.sizeId, shape: frame.shape, custom: frame.custom })
          }
        />
      )
    : undefined

  /** Picking Custom starts from the photo's current size, so nothing jumps. */
  function chooseSize(sizeId: SizeId): boolean {
    if (sizeId !== 'custom' || !item || item.sizeId === 'custom') return false
    const { short, long } = getSize(item.sizeId, paper, item.custom)
    dispatch({ type: 'setFrame', id: item.id, sizeId: 'custom', shape: item.shape, custom: { short, long } })
    return true
  }

  return {
    page: {
      showCutOff: flags.showCutOff,
      introId,
      onIntroEnd: endIntro,
      selectedClassName: flags.moveCursor ? 'has-move-cursor' : undefined,
      renderSelected,
    },
    frame: {
      showCutOff: flags.showCutOff,
      intro: item !== null && introId === item.id,
      onIntroEnd: endIntro,
      moveCursorClass: flags.moveCursor ? 'has-move-cursor' : '',
      renderSelected,
    },
    sizeList: {
      sizeIds: visibleSizes(flags, paper, item),
      custom: item?.custom,
      describe: (size: Parameters<typeof describeSize>[0]) => describeSize(size, paper, item),
      renderBelow: (sizeId: SizeId) =>
        sizeId === 'custom' && flags.customSize && item?.sizeId === 'custom' ? (
          <CustomSizeFields
            key={item.id}
            item={item}
            paper={paper}
            onChange={(shape, custom) => dispatch({ type: 'setFrame', id: item.id, sizeId: 'custom', shape, custom })}
          />
        ) : null,
    },
    chooseSize,
  }
}
