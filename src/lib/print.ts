function isAppleMobile(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isSafari(): boolean {
  return /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent)
}

/**
 * Safari can't print a PDF from a hidden frame, so there the PDF opens in a new
 * tab instead. That tab has to be opened during the click, before the PDF exists,
 * or it will be blocked as a popup.
 */
export function preparePrintWindow(): Window | null {
  return isAppleMobile() || isSafari() ? window.open('', '_blank') : null
}

let frame: HTMLIFrameElement | null = null

export function printPdf(bytes: Uint8Array, printWindow: Window | null): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))

  if (printWindow) {
    printWindow.location.href = url
    return
  }

  frame?.remove()
  frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none'
  frame.addEventListener('load', () => {
    setTimeout(() => {
      frame?.contentWindow?.focus()
      frame?.contentWindow?.print()
    }, 50)
  })
  frame.src = url
  document.body.append(frame)
}

export function savePdf(bytes: Uint8Array, filename: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
