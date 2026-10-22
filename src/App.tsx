import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AdjustPad } from './components/AdjustPad'
import { CropEditor } from './components/CropEditor'
import { AlertIcon, MinusIcon, PhotoIcon, PlusIcon, PrinterIcon, TrashIcon } from './components/icons'
import { ShapeChoices } from './components/ShapeChoices'
import { SheetPreview } from './components/SheetPreview'
import { SizeChoices } from './components/SizeChoices'
import { DevPanel } from './experiments/DevPanel'
import { DEV_MODE, useDevFlags } from './experiments/flags'
import { frameCropProps } from './experiments/frameCrop'
import { effectiveDpi } from './lib/crop'
import { layoutSheets } from './lib/layout'
import { PAPERS, defaultPaperFor, getPaper, isPaperId } from './lib/paper'
import { loadPhoto, looksLikePhoto, releasePhoto } from './lib/photo'
import { preparePrintWindow, printPdf, savePdf } from './lib/print'
import { DEFAULT_SIZE, getSize, isSizeId } from './lib/sizes'
import { readSetting, writeSetting } from './lib/storage'
import { makeSheetPdf, pdfFilename } from './printSheet'
import { MAX_COPIES, itemCrop, reducer, sheetPieces, type AppState } from './state'

/** Below this many photo pixels per inch a print starts to look soft. */
const SOFT_DPI = 150
const BLURRY_DPI = 100

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
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLElement>(null)

  const item = state.items.find((candidate) => candidate.id === state.selectedId) ?? null
  const paper = getPaper(state.paperId)
  const pages = useMemo(() => layoutSheets(sheetPieces(state.items), paper), [state.items, paper])

  // A newly added photo is selected; bring its size and shape controls back into view.
  const itemCount = state.items.length
  const previousCount = useRef(itemCount)
  useEffect(() => {
    if (itemCount > previousCount.current) panel.current?.scrollTo({ top: 0 })
    previousCount.current = itemCount
  }, [itemCount])

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
      setDragging(true)
    }
    const onDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) setDragging(false)
    }
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return
      event.preventDefault()
      setDragging(false)
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

  function removeItem(id: string) {
    const removed = state.items.find((candidate) => candidate.id === id)
    dispatch({ type: 'remove', id })
    if (removed) releasePhoto(removed.photo)
  }

  async function output(kind: 'print' | 'save') {
    const printWindow = kind === 'print' ? preparePrintWindow() : null
    setBusy(kind)
    setError(null)
    try {
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

  const dpi = item ? effectiveDpi(item.photo, getSize(item.sizeId), item.shape, itemCrop(item)) : Infinity
  const quality =
    dpi < BLURRY_DPI
      ? 'This photo will look blurry at this size.'
      : dpi < SOFT_DPI
        ? 'This photo may look a little soft at this size.'
        : null

  return (
    <div className={`app${dragging ? ' is-drop-target' : ''}`}>
      <header className="topbar">
        <span className="wordmark">Print to Frame</span>
      </header>

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
        <p className="notice is-error" role="alert">
          <AlertIcon />
          {error}
        </p>
      )}

      {!item ? (
        <main className="empty">
          <div className="empty-card">
            <span className="empty-icon">
              <PhotoIcon />
            </span>
            <button type="button" className="primary-button" onClick={() => fileInput.current?.click()}>
              Choose a photo
            </button>
            <p className="empty-hint">or drop one here</p>
          </div>
        </main>
      ) : (
        <main className="workspace">
          <section className="editor" aria-label="Crop">
            <CropEditor
              item={item}
              onCrop={(crop) => item.shape !== 'whole' && dispatch({ type: 'setCrop', id: item.id, shape: item.shape, crop })}
              {...frameCropProps(flags)}
            />
            <div className="editor-footer">
              {item.shape !== 'whole' && (
                <AdjustPad
                  item={item}
                  onCrop={(crop) => item.shape !== 'whole' && dispatch({ type: 'setCrop', id: item.id, shape: item.shape, crop })}
                />
              )}
              {quality && (
                <p className="notice">
                  <AlertIcon />
                  {quality}
                </p>
              )}
            </div>
          </section>

          <aside className="panel" ref={panel}>
            <section className="panel-section">
              <h2>Size</h2>
              <SizeChoices item={item} onChange={(sizeId) => dispatch({ type: 'setSize', id: item.id, sizeId })} />
            </section>

            <section className="panel-section">
              <h2>Shape</h2>
              <ShapeChoices item={item} onChange={(shape) => dispatch({ type: 'setShape', id: item.id, shape })} />
            </section>

            <section className="panel-section">
              <div className="section-head">
                <h2>Paper</h2>
                <div className="segmented" role="radiogroup" aria-label="Paper">
                  {PAPERS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={state.paperId === option.id}
                      onClick={() => dispatch({ type: 'setPaper', paperId: option.id })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <SheetPreview
                pages={pages}
                paper={paper}
                items={state.items}
                selectedId={state.selectedId}
                onSelect={(id) => dispatch({ type: 'select', id })}
              />
              <div className="item-tools">
                <div className="stepper" role="group" aria-label="Copies">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="One fewer copy"
                    disabled={item.copies <= 1}
                    onClick={() => dispatch({ type: 'setCopies', id: item.id, copies: item.copies - 1 })}
                  >
                    <MinusIcon />
                  </button>
                  <output aria-live="polite">
                    {item.copies} {item.copies === 1 ? 'copy' : 'copies'}
                  </output>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="One more copy"
                    disabled={item.copies >= MAX_COPIES}
                    onClick={() => dispatch({ type: 'setCopies', id: item.id, copies: item.copies + 1 })}
                  >
                    <PlusIcon />
                  </button>
                </div>
                <button type="button" className="text-button" onClick={() => removeItem(item.id)}>
                  <TrashIcon />
                  Remove
                </button>
              </div>
              <button type="button" className="secondary-button" onClick={() => fileInput.current?.click()}>
                <PlusIcon />
                Add another photo
              </button>
            </section>

            <div className="actions">
              <button type="button" className="primary-button" disabled={busy !== null} onClick={() => void output('print')}>
                <PrinterIcon />
                {busy === 'print' ? 'Preparing…' : 'Print'}
              </button>
              <button type="button" className="text-button" disabled={busy !== null} onClick={() => void output('save')}>
                {busy === 'save' ? 'Preparing…' : 'Save as PDF'}
              </button>
            </div>
          </aside>
        </main>
      )}

      {DEV_MODE && <DevPanel flags={flags} onChange={setFlags} />}
    </div>
  )
}
