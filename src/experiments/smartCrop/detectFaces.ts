/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Face detection runs on the device with MediaPipe. Only the model and its runtime are
 * downloaded; the photo never leaves the browser.
 */
import type { FaceDetector } from '@mediapipe/tasks-vision'
import type { Face } from './nudge'

// Keep in step with the @mediapipe/tasks-vision version in package.json.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm'
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
/** The model looks at a small image anyway; a smaller input is much faster with no loss. */
const MAX_INPUT_SIDE = 1280

let detector: Promise<FaceDetector> | null = null

function loadDetector(): Promise<FaceDetector> {
  detector ??= import('@mediapipe/tasks-vision').then(async ({ FaceDetector, FilesetResolver }) =>
    FaceDetector.createFromOptions(await FilesetResolver.forVisionTasks(WASM_BASE), {
      baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5,
    }),
  )
  detector.catch(() => {
    detector = null
  })
  return detector
}

/** Face boxes in the photo's own pixels. */
export async function detectFaces(bitmap: ImageBitmap): Promise<Face[]> {
  const faceDetector = await loadDetector()
  const scale = Math.min(1, MAX_INPUT_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  return faceDetector.detect(canvas).detections.flatMap(({ boundingBox: box }) =>
    box ? [{ x: box.originX / scale, y: box.originY / scale, width: box.width / scale, height: box.height / scale }] : [],
  )
}
