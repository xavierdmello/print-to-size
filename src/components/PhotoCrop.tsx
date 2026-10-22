import type { CSSProperties } from 'react'
import { cropRect, type Crop, type Dimensions, type Shape } from '../lib/crop'
import type { Photo } from '../lib/photo'
import { photoPlacement, wholePlacement } from './placement'

interface PhotoCropProps {
  photo: Photo
  shape: Shape
  crop: Crop
  /** Printed size in inches; only the proportions matter here. */
  print: Dimensions
  className?: string
  style?: CSSProperties
}

/** The photo as it will print: cropped, or whole on white. Fills its container. */
export function PhotoCrop({ photo, shape, crop, print, className, style }: PhotoCropProps) {
  const placement =
    shape === 'whole' ? wholePlacement(photo, print) : photoPlacement(photo, cropRect(photo, print.width / print.height, crop))
  return (
    <div className={['photo-crop', className].filter(Boolean).join(' ')} style={style}>
      <img src={photo.url} alt="" draggable={false} style={placement} />
    </div>
  )
}
