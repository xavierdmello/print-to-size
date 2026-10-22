/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 */
import type { DevFlags, FrameStyle, Switch } from './flags'
import './experiments.css'

const GROUPS: { title: string; switches: { key: Switch; label: string }[] }[] = [
  {
    title: 'Showing the crop',
    switches: [
      { key: 'showCutOff', label: 'Cut-off parts always visible' },
      { key: 'cropIntro', label: 'Crop-in animation' },
      { key: 'moveHint', label: 'Move cursor and icon' },
      { key: 'dragCaption', label: '"Drag to move" caption' },
    ],
  },
  {
    title: 'On the photo',
    switches: [
      { key: 'sizeMarks', label: 'Size marks' },
      { key: 'shapeSwitch', label: 'Wide/tall switch' },
      { key: 'dragResize', label: 'Drag edges to resize' },
    ],
  },
  {
    title: 'Sizes',
    switches: [
      { key: 'moreSizes', label: 'Square and passport sizes' },
      { key: 'customSize', label: 'Custom size' },
    ],
  },
  {
    title: 'Earlier',
    switches: [
      { key: 'frameCrop', label: 'Frame crop' },
      { key: 'realSize', label: 'Real size' },
      { key: 'smartCrop', label: 'Smart crop' },
    ],
  },
]

interface DevPanelProps {
  flags: DevFlags
  onChange: (flags: DevFlags) => void
  smartCropStatus?: string
}

export function DevPanel({ flags, onChange, smartCropStatus }: DevPanelProps) {
  return (
    <details className="dev-panel" open>
      <summary>Experiments</summary>
      {GROUPS.map((group) => (
        <fieldset key={group.title}>
          <legend>{group.title}</legend>
          {group.switches.map(({ key, label }) => (
            <label key={key}>
              <input type="checkbox" checked={flags[key]} onChange={() => onChange({ ...flags, [key]: !flags[key] })} />
              {label}
            </label>
          ))}
          {group.title === 'Earlier' && flags.frameCrop && (
            <select
              aria-label="Frame style"
              value={flags.frameStyle}
              onChange={(event) => onChange({ ...flags, frameStyle: event.currentTarget.value as FrameStyle })}
            >
              <option value="black">Black frame</option>
              <option value="white">White frame</option>
              <option value="wood">Wood frame</option>
            </select>
          )}
          {group.title === 'Earlier' && flags.smartCrop && smartCropStatus && <small>{smartCropStatus}</small>}
        </fieldset>
      ))}
    </details>
  )
}
