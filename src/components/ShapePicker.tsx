import type { Shape } from '../lib/crop'

const SHAPES: { shape: Shape; label: string }[] = [
  { shape: 'wide', label: 'Wide' },
  { shape: 'tall', label: 'Tall' },
]

interface ShapePickerProps {
  shape: Shape | null
  onChange: (shape: Shape) => void
}

export function ShapePicker({ shape, onChange }: ShapePickerProps) {
  return (
    <div className="button-group" role="radiogroup" aria-labelledby="shape-label">
      {SHAPES.map((option) => (
        <button
          key={option.shape}
          type="button"
          role="radio"
          className="button"
          aria-checked={shape === option.shape}
          disabled={shape === null}
          onClick={() => onChange(option.shape)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
