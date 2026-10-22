/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 */
import type { DevFlags, FrameStyle } from './flags'
import './experiments.css'

interface DevPanelProps {
  flags: DevFlags
  onChange: (flags: DevFlags) => void
  smartCropStatus?: string
}

export function DevPanel({ flags, onChange, smartCropStatus }: DevPanelProps) {
  const toggle = (key: 'frameCrop' | 'realSize' | 'smartCrop') => onChange({ ...flags, [key]: !flags[key] })
  return (
    <details className="dev-panel" open>
      <summary>Experiments</summary>
      <label>
        <input type="checkbox" checked={flags.frameCrop} onChange={() => toggle('frameCrop')} />
        Frame crop
      </label>
      {flags.frameCrop && (
        <select
          aria-label="Frame style"
          value={flags.frameStyle}
          onChange={(event) => onChange({ ...flags, frameStyle: event.currentTarget.value as FrameStyle })}
        >
          <option value="black">Black</option>
          <option value="white">White</option>
          <option value="wood">Wood</option>
        </select>
      )}
      <label>
        <input type="checkbox" checked={flags.realSize} onChange={() => toggle('realSize')} />
        Real size
      </label>
      <label>
        <input type="checkbox" checked={flags.smartCrop} onChange={() => toggle('smartCrop')} />
        Smart crop
      </label>
      {flags.smartCrop && smartCropStatus && <small>{smartCropStatus}</small>}
    </details>
  )
}
