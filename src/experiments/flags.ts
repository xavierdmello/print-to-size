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
  moveCursor: boolean
  sizeMarks: boolean
  shapeSwitch: boolean
  moreSizes: boolean
  customSize: boolean
  dragResize: boolean
}

export type Switch = Exclude<keyof DevFlags, 'frameStyle'>

/**
 * Where every switch starts, here and in the live app. The ones approved after testing are on;
 * the rest are still being tried out and stay off unless switched on in the dev panel.
 */
const DEFAULTS: DevFlags = {
  frameCrop: false,
  frameStyle: 'black',
  realSize: false,
  smartCrop: false,
  showCutOff: true,
  cropIntro: false,
  moveCursor: true,
  sizeMarks: true,
  shapeSwitch: true,
  moreSizes: false,
  customSize: true,
  dragResize: false,
}

// A new name, so switches saved before the approved ones defaulted on don't override that.
const STORAGE_KEY = 'dev-flags-v2'

/** The switch panel only exists when the page is opened with `?dev`. */
export const DEV_MODE = new URLSearchParams(location.search).has('dev')

function load(): DevFlags {
  if (!DEV_MODE) return DEFAULTS
  try {
    return { ...DEFAULTS, ...JSON.parse(readSetting(STORAGE_KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

export function useDevFlags() {
  const [flags, setFlags] = useState<DevFlags>(load)
  useEffect(() => {
    if (DEV_MODE) writeSetting(STORAGE_KEY, JSON.stringify(flags))
  }, [flags])
  return [flags, setFlags] as const
}
