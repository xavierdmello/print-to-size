/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see docs/development.md, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Turns the dev switches into props for the editors, the size list and the bottom bar, so the
 * app only spreads them in. With every switch off, everything here gives the editors nothing extra.
 */
import type { Dispatch } from 'react'
import type { Selection } from '../components/selection'
import type { Paper } from '../lib/paper'
import { getSize, largestSize, MIN_CUSTOM, type SizeId } from '../lib/sizes'
import type { Action, PrintItem } from '../state'
import type { DevFlags } from './flags'
import { snapFrame, unitFor, type SnappedFrame } from './onPhoto/measure'
import { PhotoOverlay } from './onPhoto/PhotoOverlay'
import { useCropIntro } from './onPhoto/useCropIntro'
import { SizeFields } from './sizes/SizeFields'
import { snapTargets, visibleSizes } from './sizes/sizeOptions'

export function useExperiments(
  flags: DevFlags,
  paper: Paper,
  items: readonly PrintItem[],
  item: PrintItem | null,
  /** The size picked in the list before there's a photo. */
  sizeId: SizeId,
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

  function setFrame(target: PrintItem, frame: SnappedFrame) {
    dispatch({ type: 'setFrame', id: target.id, sizeId: frame.sizeId, shape: frame.shape, custom: frame.custom })
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
          commitResize={(frame) => setFrame(selection.item, frame)}
        />
      )
    : undefined

  /** Picking Custom size starts from the photo's current size, so nothing jumps. */
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
      footer: flags.customSize ? (
        <SizeFields
          key={item?.id ?? 'none'}
          item={item}
          sizeId={sizeId}
          paper={paper}
          resolve={previewResize}
          onChange={(frame) => item && setFrame(item, frame)}
        />
      ) : null,
    },
    chooseSize,
  }
}
