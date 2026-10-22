# Print to Size

Print a photo at the exact size of a picture frame on ordinary paper.

Add one or more photos, pick a size (full page, 4×6, 5×7, 8×10, 3½×5 or wallet; on A4, the metric frame sizes 10×15, 13×18, 20×25 and 9×13 cm), choose wide or tall, and drag the photo into place right on the page, or untick **Fit picture to frame** to print the whole photo with white space around it. The app arranges the photos on a Letter or A4 sheet at their true size, with a dotted cut line around each one, and prints a PDF so the size survives the print dialog.

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

This repo is a prototype. Besides the core app it contains UI experiments that sit behind dev-only switches, so different ideas can be compared on the same photo. Open the app with `?dev` in the URL to show the switch panel; normal users never see it. Switches marked **on** below have been approved and are on by default, in the live app as well as in dev; the rest are off until switched on in the panel.

| Switch | Default | Idea being tested |
| --- | --- | --- |
| Cut-off parts always visible | **on** | The parts of the photo the crop leaves out show faintly around it, behind the other photos |
| Crop-in animation | off | When a photo is added, it shows whole, then the crop closes in (skipped for reduced motion) |
| Move cursor | **on** | A move cursor over the selected photo, showing it can be dragged |
| Size marks | **on** | Measurement lines along the top and left edge with the printed size, in inches or cm |
| Wide/tall switch | **on** | A button at the photo's corner that switches the frame between wide and tall |
| Drag edges to resize | off | Handles on the photo's edges; dragging resizes it, snapping to standard sizes or becoming Custom |
| Square and passport sizes | off | 4×4, 5×5, 8×8 in. and 2×2 in. passport (10×10, 13×13, 20×20 cm and 35×45 mm on A4) |
| Custom size | **on** | Width and height boxes pinned under the size list; typing a size snaps to a standard one or becomes Custom size, which joins the list |
| Frame crop | off | Crop by sliding the photo behind a drawn picture frame instead of on the page |
| Real size | off | Show the print at its true physical size on screen, after a one-time calibration against a bank card |
| Smart crop | off | Start the crop centred, but shift it just enough to avoid cutting through a face (on-device face detection) |

The switches are independent and can be combined; anything drawn on the photo is laid out so all of it fits together. In the frame crop view, resize handles are left out because that view rescales the frame as it changes size.

**The experiment code is throwaway.** It exists to answer design questions, not as a pattern to build on. The switch mechanism, the `src/experiments/` folder and anything gated by it should not be treated as normal practice or extended. Once an experiment is judged, either delete it or rebuild the winning idea properly in the core app, without the switch.
