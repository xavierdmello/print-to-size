/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see docs/development.md, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Browsers don't know how big a screen physically is, so the viewer calibrates once by
 * matching an outline to a bank card. Browser zoom changes the scale, so a change in
 * devicePixelRatio asks for calibration again.
 */
import { useEffect, useState } from 'react'
import { PhotoCrop } from '../components/PhotoCrop'
import type { Dimensions } from '../lib/crop'
import { readSetting, writeSetting } from '../lib/storage'
import { itemCrop, itemDimensions, type PrintItem } from '../state'

/** ISO/IEC 7810 ID-1, the size of bank and ID cards. */
const CARD = { width: 85.6 / 25.4, height: 53.98 / 25.4 }

interface Calibration {
  pxPerInch: number
  devicePixelRatio: number
}

function loadCalibration(): Calibration | null {
  try {
    const saved = JSON.parse(readSetting('real-size-calibration') ?? 'null') as Calibration | null
    return saved && saved.devicePixelRatio === window.devicePixelRatio ? saved : null
  } catch {
    return null
  }
}

interface RealSizeProps {
  item: PrintItem
  paper: Dimensions
  framed: string | undefined
  onClose: () => void
}

export function RealSizeView({ item, paper, framed, onClose }: RealSizeProps) {
  const [calibration, setCalibration] = useState(loadCalibration)
  const [calibrating, setCalibrating] = useState(calibration === null)
  const [pxPerInch, setPxPerInch] = useState(calibration?.pxPerInch ?? 110)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function finishCalibration() {
    const saved = { pxPerInch, devicePixelRatio: window.devicePixelRatio }
    writeSetting('real-size-calibration', JSON.stringify(saved))
    setCalibration(saved)
    setCalibrating(false)
  }

  const print = itemDimensions(item, paper)

  return (
    <div className="real-size" role="dialog" aria-modal="true" aria-label="Real size">
      <div className="real-size-bar">
        {!calibrating && (
          <button type="button" className="link-button" onClick={() => setCalibrating(true)}>
            Adjust scale
          </button>
        )}
        <button type="button" className="button" onClick={onClose}>
          Close
        </button>
      </div>

      {calibrating ? (
        <div className="real-size-calibrate">
          <p>Hold a bank card against the screen and drag the slider until the outline matches it.</p>
          <div
            className="real-size-card"
            style={{ width: CARD.width * pxPerInch, height: CARD.height * pxPerInch }}
          />
          <input
            id="real-size-scale"
            type="range"
            min={50}
            max={220}
            step={0.5}
            value={pxPerInch}
            aria-label="Card outline size"
            onChange={(event) => setPxPerInch(Number(event.currentTarget.value))}
          />
          <button type="button" className="button default large" onClick={finishCalibration}>
            Done
          </button>
        </div>
      ) : (
        calibration && (
          <div className="real-size-stage">
            <div
              className={`real-size-print ${framed ?? ''}`}
              style={{
                width: print.width * calibration.pxPerInch,
                height: print.height * calibration.pxPerInch,
                ['--ppi' as string]: `${calibration.pxPerInch}px`,
              }}
            >
              <PhotoCrop photo={item.photo} fit={item.fit} crop={itemCrop(item)} print={print} />
              {framed && <div className="crop-shade" />}
            </div>
          </div>
        )
      )}
    </div>
  )
}

/** The button that opens the real-size view, for the editor footer. */
export function RealSizeButton({ item, paper, framed }: Omit<RealSizeProps, 'onClose'>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="button" onClick={() => setOpen(true)}>
        See real size
      </button>
      {open && <RealSizeView item={item} paper={paper} framed={framed} onClose={() => setOpen(false)} />}
    </>
  )
}
