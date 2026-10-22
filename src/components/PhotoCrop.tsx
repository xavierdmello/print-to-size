import type { CSSProperties } from 'react'
import { cropRect, type Crop, type Dimensions } from '../lib/crop'
import type { Photo } from '../lib/photo'
import { photoPlacement, wholePlacement } from './placement'

interface PhotoCropProps {
  photo: Photo
  /** Fill the box with the crop, or show the whole photo inside it on white. */
  fit: boolean
  crop: Crop
  /** Printed size in inches; only the proportions matter here. */
  print: Dimensions
  className?: string
  style?: CSSProperties
}

/** The photo as it will print: cropped, or whole on white. Fills its container. */
export function PhotoCrop({ photo, fit, crop, print, className, style }: PhotoCropProps) {
  const placement = fit
    ? photoPlacement(photo, cropRect(photo, print.width / print.height, crop))
    : wholePlacement(photo, print)
  return (
    <div className={['photo-crop', className].filter(Boolean).join(' ')} style={style}>
      <img src={photo.url} alt="" draggable={false} style={placement} />
    </div>
  )
}
