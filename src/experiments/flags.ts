/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 */
import { useEffect, useState } from 'react'
import { readSetting, writeSetting } from '../lib/storage'

export type FrameStyle = 'black' | 'white' | 'wood'

export interface DevFlags {
  frameCrop: boolean
  frameStyle: FrameStyle
  realSize: boolean
  smartCrop: boolean
  showCutOff: boolean
  cropIntro: boolean
  moveHint: boolean
  dragCaption: boolean
  sizeMarks: boolean
  shapeSwitch: boolean
  moreSizes: boolean
  customSize: boolean
  dragResize: boolean
}

export type Switch = Exclude<keyof DevFlags, 'frameStyle'>

const OFF: DevFlags = {
  frameCrop: false,
  frameStyle: 'black',
  realSize: false,
  smartCrop: false,
  showCutOff: false,
  cropIntro: false,
  moveHint: false,
  dragCaption: false,
  sizeMarks: false,
  shapeSwitch: false,
  moreSizes: false,
  customSize: false,
  dragResize: false,
}

/** The switch panel only exists when the page is opened with `?dev`. */
export const DEV_MODE = new URLSearchParams(location.search).has('dev')

function load(): DevFlags {
  if (!DEV_MODE) return OFF
  try {
    return { ...OFF, ...JSON.parse(readSetting('dev-flags') ?? '{}') }
  } catch {
    return OFF
  }
}

export function useDevFlags() {
  const [flags, setFlags] = useState<DevFlags>(load)
  useEffect(() => {
    if (DEV_MODE) writeSetting('dev-flags', JSON.stringify(flags))
  }, [flags])
  return [flags, setFlags] as const
}
