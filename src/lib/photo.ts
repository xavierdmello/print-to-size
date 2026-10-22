export interface Photo {
  id: string
  name: string
  /** Object URL of a browser-displayable version of the photo. */
  url: string
  width: number
  height: number
  bitmap: ImageBitmap
}

export class UnsupportedPhotoError extends Error {}

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

export function looksLikePhoto(file: File): boolean {
  return file.type.startsWith('image/') || isHeic(file)
}

async function decode(blob: Blob): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(blob)
  } catch {
    return null
  }
}

/** Decodes a photo the way it appears on the phone, including HEIC on browsers that can't show it. */
export async function loadPhoto(file: File): Promise<Photo> {
  let displayable: Blob = file
  let bitmap = await decode(file)

  if (!bitmap && isHeic(file)) {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })
    displayable = Array.isArray(converted) ? converted[0] : converted
    bitmap = await decode(displayable)
  }

  if (!bitmap) throw new UnsupportedPhotoError(`Could not open ${file.name}`)

  return {
    id: crypto.randomUUID(),
    name: file.name,
    url: URL.createObjectURL(displayable),
    width: bitmap.width,
    height: bitmap.height,
    bitmap,
  }
}

export function releasePhoto(photo: Photo): void {
  URL.revokeObjectURL(photo.url)
  photo.bitmap.close()
}
