import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AdjustPad } from './components/AdjustPad'
import { MinusIcon, PlusIcon } from './components/icons'
import { PageEditor } from './components/PageEditor'
import { ShapePicker } from './components/ShapePicker'
import { SizeList } from './components/SizeList'
import { DevPanel } from './experiments/DevPanel'
import { DEV_MODE, useDevFlags } from './experiments/flags'
import { CropEditor } from './experiments/frameCrop/CropEditor'
import { frameCropProps } from './experiments/frameCrop/frameCrop'
import { RealSizeButton } from './experiments/RealSize'
import { useSmartCrop } from './experiments/smartCrop/useSmartCrop'
import type { Crop } from './lib/crop'
import { layoutSheets } from './lib/layout'
import { PAPERS, defaultPaperFor, getPaper, isPaperId } from './lib/paper'
import { loadPhoto, looksLikePhoto, releasePhoto } from './lib/photo'
import { preparePrintWindow, printPdf, savePdf } from './lib/print'
import { DEFAULT_SIZE, isSizeId, type SizeId } from './lib/sizes'
import { readSetting, writeSetting } from './lib/storage'
import { MAX_COPIES, reducer, sheetPieces, type AppState, type PrintItem } from './state'

function initialState(): AppState {
  const paper = readSetting('paper')
  const size = readSetting('size')
  return {
    items: [],
    selectedId: null,
    paperId: isPaperId(paper) ? paper : defaultPaperFor(navigator.language),
    sizeId: isSizeId(size) ? size : DEFAULT_SIZE,
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [flags, setFlags] = useDevFlags()
  const [busy, setBusy] = useState<'print' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dropping, setDropping] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const item = state.items.find((candidate) => candidate.id === state.selectedId) ?? null
  const paper = getPaper(state.paperId)
  const pages = useMemo(() => layoutSheets(sheetPieces(state.items, paper), paper), [state.items, paper])
  const itemRotated = pages.some((page) => page.placements.some((p) => p.key === item?.id && p.rotated))

  const smartCropStatus = useSmartCrop(state.items, paper, flags.smartCrop, dispatch)

  useEffect(() => writeSetting('paper', state.paperId), [state.paperId])
  useEffect(() => writeSetting('size', state.sizeId), [state.sizeId])

  const addFiles = useCallback(async (files: Iterable<File>) => {
    setError(null)
    for (const file of files) {
      if (!looksLikePhoto(file)) {
        setError(`${file.name} isn't a photo. Choose a JPEG, PNG or HEIC file.`)
        continue
      }
      try {
        dispatch({ type: 'add', photo: await loadPhoto(file) })
      } catch {
        setError(`${file.name} couldn't be opened. Choose a JPEG, PNG or HEIC file.`)
      }
    }
  }, [])

  useEffect(() => {
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false
    const onDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      setDropping(true)
    }
    const onDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) setDropping(false)
    }
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      setDropping(false)
      void addFiles(event.dataTransfer?.files ?? [])
    }
    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])].filter(looksLikePhoto)
      if (files.length) void addFiles(files)
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('paste', onPaste)
    }
  }, [addFiles])

  function setCrop(target: PrintItem, crop: Crop) {
    if (target.shape !== 'whole') dispatch({ type: 'setCrop', id: target.id, shape: target.shape, crop })
  }

  function setSize(sizeId: SizeId) {
    dispatch(item ? { type: 'setSize', id: item.id, sizeId } : { type: 'setDefaultSize', sizeId })
  }

  function removeItem(target: PrintItem) {
    dispatch({ type: 'remove', id: target.id })
    releasePhoto(target.photo)
  }

  async function output(kind: 'print' | 'save') {
    const printWindow = kind === 'print' ? preparePrintWindow() : null
    setBusy(kind)
    setError(null)
    try {
      // The PDF code is only needed once someone prints, so it loads then.
      const { makeSheetPdf, pdfFilename } = await import('./printSheet')
      const pdf = await makeSheetPdf(state.items, state.paperId)
      if (kind === 'print') printPdf(pdf, printWindow)
      else savePdf(pdf, pdfFilename(state.items))
    } catch {
      printWindow?.close()
      setError('Something went wrong making the page. Try again, or use a different photo.')
    } finally {
      setBusy(null)
    }
  }

  const chooseFiles = () => fileInput.current?.click()
  const nothingToPrint = state.items.length === 0 || busy !== null

  return (
    <div className={`dialog${dropping ? ' is-drop-target' : ''}`}>
      <header className="dialog-header">
        <h1>Print to Size</h1>
      </header>

      <div className="toolbar">
        <label className="field">
          <span>Paper size:</span>
          <select
            id="paper"
            className="select"
            value={state.paperId}
            onChange={(event) => {
              const paperId = event.currentTarget.value
              if (isPaperId(paperId)) dispatch({ type: 'setPaper', paperId })
            }}
          >
            {PAPERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span id="shape-label">Shape:</span>
          <ShapePicker
            shape={item?.shape ?? null}
            onChange={(shape) => item && dispatch({ type: 'setShape', id: item.id, shape })}
          />
        </div>
        <button type="button" className="button toolbar-end" onClick={chooseFiles}>
          Add photos…
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(event) => {
          void addFiles(event.currentTarget.files ?? [])
          event.currentTarget.value = ''
        }}
      />

      {error && (
        <p className="info-bar" role="alert">
          {error}
        </p>
      )}

      <div className="dialog-body">
        <section className="preview" aria-label="Preview">
          {flags.frameCrop && item ? (
            <CropEditor item={item} paper={paper} onCrop={(crop) => setCrop(item, crop)} {...frameCropProps(flags)} />
          ) : (
            <PageEditor
              pages={pages}
              paper={paper}
              items={state.items}
              selectedId={state.selectedId}
              onSelect={(id) => dispatch({ type: 'select', id })}
              onCrop={setCrop}
              empty={
                <div className="page-empty">
                  <button type="button" className="button default large" onClick={chooseFiles}>
                    Choose photos…
                  </button>
                  <span className="drop-hint">or drop them here</span>
                </div>
              }
            />
          )}
        </section>
        <SizeList shape={item?.shape ?? 'wide'} paper={paper} sizeId={item?.sizeId ?? state.sizeId} onChange={setSize} />
      </div>

      <div className="options-bar">
        <div className="field">
          <span id="copies-label">Copies of this photo:</span>
          <div className="stepper" role="group" aria-labelledby="copies-label">
            <button
              type="button"
              className="button icon"
              aria-label="One fewer copy"
              disabled={!item || item.copies <= 1}
              onClick={() => item && dispatch({ type: 'setCopies', id: item.id, copies: item.copies - 1 })}
            >
              <MinusIcon />
            </button>
            <output aria-live="polite">{item?.copies ?? 1}</output>
            <button
              type="button"
              className="button icon"
              aria-label="One more copy"
              disabled={!item || item.copies >= MAX_COPIES}
              onClick={() => item && dispatch({ type: 'setCopies', id: item.id, copies: item.copies + 1 })}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
        <AdjustPad item={item} paper={paper} rotated={itemRotated && !flags.frameCrop} onCrop={(crop) => item && setCrop(item, crop)} />
        <div className="options-end">
          {flags.realSize && item && <RealSizeButton item={item} paper={paper} framed={frameCropProps(flags).className} />}
          {item && (
            <button type="button" className="link-button" onClick={() => removeItem(item)}>
              Remove photo
            </button>
          )}
        </div>
      </div>

      <footer className="dialog-footer">
        <button type="button" className="button" disabled={nothingToPrint} onClick={() => void output('save')}>
          {busy === 'save' ? 'Preparing…' : 'Save as PDF'}
        </button>
        <button type="button" className="button default" disabled={nothingToPrint} onClick={() => void output('print')}>
          {busy === 'print' ? 'Preparing…' : 'Print'}
        </button>
      </footer>

      {DEV_MODE && <DevPanel flags={flags} onChange={setFlags} smartCropStatus={smartCropStatus} />}
    </div>
  )
}
