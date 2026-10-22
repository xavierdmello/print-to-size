# Print to Frame

Print a photo at the exact size of a picture frame on ordinary paper.

Add one or more photos, pick a frame size (4×6, 5×7, 8×10, 3½×5 or wallet), choose a wide, tall or whole-photo crop, and drag the photo into place right on the page. The app arranges the photos on a Letter or A4 sheet at their true size, with a dotted cut line around each one, and prints a PDF so the size survives the print dialog.

The look is modelled on the Windows 7 Print Pictures dialog. Everything happens in the browser; photos are never uploaded.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (crop math, sheet layout, PDF)
npm run typecheck
npm run build
```

## Project layout

```
src/
  lib/            crop math, sheet layout, image decoding, PDF output, printing
  components/     UI: page preview and in-place cropping, size list, controls
  state.ts        the photos on the sheet and what's been chosen for each
  experiments/    dev-only UI experiments (see below)
docs/
  design-decisions.md   interface choices that were questioned and settled, and why
```

## Experiments

This repo is a prototype. Besides the core app it contains a few UI experiments that sit behind dev-only switches, so different ideas can be compared on the same photo. Open the app with `?dev` in the URL to show the switch panel. Every switch is off by default, and normal users never see the panel.

| Switch | Idea being tested |
| --- | --- |
| Frame crop | Crop by sliding the photo behind a drawn picture frame instead of on the page |
| Real size | Show the print at its true physical size on screen, after a one-time calibration against a bank card |
| Smart crop | Start the crop centred, but shift it just enough to avoid cutting through a face (on-device face detection) |

**The experiment code is throwaway.** It exists to answer design questions, not as a pattern to build on. The switch mechanism, the `src/experiments/` folder and anything gated by it should not be treated as normal practice or extended. Once an experiment is judged, either delete it or rebuild the winning idea properly in the core app, without the switch.
