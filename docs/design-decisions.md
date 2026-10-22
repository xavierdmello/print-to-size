# Design decisions

Choices about the interface that were questioned and settled, with the reasoning, so they aren't undone by accident. Add new entries at the end.

## Ground rule: the Windows 7 Print Pictures dialog is the reference

When in doubt, do what Windows 7 did: its look, its layouts, and how many of each size fit on a sheet (Full page 1, 4×6 2, 5×7 2, 8×10 1, 3½×5 4, Wallet 9). Only depart from it where it was weak, such as letting you choose the crop, or where the owner has decided to. A rule of our own that makes the app behave differently from Windows 7 needs that decision first; don't add one on our own judgement.

Concretely, from its screenshots: photos sit in rows with a thin gap between them (we use 0.1 in) inside a ⅛ in page margin, all facing the same way, and **the page turns to landscape rather than the photos turning sideways**, so photos always look upright in the preview and the size list.

This replaces two earlier rules of ours. First, a ¼ in gap between photos "for cutting", plus squeezing extra photos onto a page by turning some of them, which gave counts Windows 7 doesn't (three 4×6s, eight wallets). Then photos edge to edge with no gap at all, which overcorrected: Windows 7 does leave a thin gap.

## "Add photos…" stays in the toolbar, always visible, with the same name

The toolbar has an **Add photos…** button at the right, even before any photo is loaded, when the blank page also shows **Choose photos…**.

**Alternatives considered**

- Hide the toolbar button until there's a photo, then show it as "Add another photo…".
- Move it to the bottom bar next to Copies and Remove photo.

**Why we kept it as it is**

- **Controls stay put.** People find buttons by remembering where they were, and older or less confident users rely on that most. A button that appears later, or moves, reads as something having broken, and they have to hunt for it.
- **Disable, don't hide.** The Windows 7 Print Pictures dialog this app is modelled on keeps every control in place and greys out the ones that don't apply. Shape, Copies and the crop buttons already work that way here; hiding this one would break the pattern.
- **The name works in every state.** "Add photos…" makes sense with no photos and with several. "Add another photo…" is clearer once there's a photo, but wrong before, and the only way to fix that is to change the label or hide the button, which brings back the first problem.
- **Two ways in is fine.** With no photo yet, the large Choose photos… on the page is the obvious first step, and the toolbar button is where adding photos always lives. A duplicate does no harm when one of the two never moves.

**If adding more photos still feels hidden**, add something to the page, such as an empty slot showing where the next photo would go, without moving or renaming this button.

## The size list shows a sample photo, not the viewer's photo

Each size in the list is a little sheet of paper laid out the way that size prints, filled with the same sample landscape, as in the Windows 7 Print Pictures dialog. The number in brackets is how many of that size fit on one sheet.

**Alternative considered**

- Fill the little sheets with the viewer's own photo.

**Why the sample photo**

- **The list's job is to show layout:** how big each size is and how many fit on a page. A familiar, neutral picture makes that easy to compare at a glance.
- **The viewer's photo is already shown large** on the page preview, cropped exactly as it will print. Repeating it six times at thumbnail size adds nothing and makes the list busy.
- **It stays calm and consistent.** The list looks the same whatever the photo, the way the Windows 7 dialog did.

The sample is our own drawing (`src/components/sample-photo.svg`), not Microsoft's image.

## "Fit picture to frame" instead of a "Whole photo" shape

Shape is just **Wide** or **Tall**, and a **Fit picture to frame** checkbox in the bottom bar (on by default) decides whether the photo fills the frame, cropped, or sits whole inside it with white space. This replaces a third shape button, "Whole photo".

**Why**

- **They are two separate choices.** Which way the frame stands and whether the photo gets cropped are independent. "Whole photo" mixed them up, picked the orientation for you, and couldn't put a whole photo in a frame standing the other way.
- **It's the Windows 7 control, word for word.** Its "Fit picture to frame" checkbox is clear to people who've used it, and the preview updates the moment it's ticked or unticked, so anyone who reads "fit" the other way sees the result straight away.
- **Nothing hides.** With the box unticked, or no photo yet, the crop buttons grey out in place rather than disappearing. They sit under the preview, where Windows 7 puts its page arrows, which keeps the bottom bar to Copies and this checkbox.

## A4 offers metric frame sizes

With Letter paper the sizes are in inches; with A4 they are the metric frame sizes sold where A4 is used: 10 × 15, 13 × 18, 20 × 25 and 9 × 13 cm, plus Full page photo and Wallet. Switching paper swaps each photo's size for its counterpart (4 × 6 in. ↔ 10 × 15 cm, 5 × 7 in. ↔ 13 × 18 cm, 8 × 10 in. ↔ 20 × 25 cm, 3½ × 5 in. ↔ 9 × 13 cm).

**Why:** the inch sizes printed exactly on A4, but they don't match metric frames: a 4 × 6 in. print is about 2 mm too big for a 10 × 15 cm frame, and a 5 × 7 in. print about 3 mm too small for a 13 × 18 cm one. Windows 7 switches to centimetre sizes on A4 for the same reason.

## No "Drag to move" caption

We tried a small "Drag to move" caption on the selected photo, behind a dev switch, and removed it.

**Why:** it isn't needed. The approved, on-by-default switches already make both points it was meant to make, without words on the photo:

- **Cut-off parts always visible** shows that the photo is being cropped and that there's more of it to slide into view.
- **The move cursor** shows the photo can be dragged as soon as the pointer is over it.
- **Size marks** and **the wide/tall switch** sit around the photo and make it read as something you can adjust.

The four-arrow move icon from the same experiment went too, for the same reason; the cursor alone was enough.

