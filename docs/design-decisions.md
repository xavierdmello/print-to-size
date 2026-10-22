# Design decisions

Choices about the interface that were questioned and settled, with the reasoning, so they aren't undone by accident. Add new entries at the end.

## Ground rule: the Windows 7 Print Pictures dialog is the reference

When in doubt, do what Windows 7 did: its look, its layouts, and how many of each size fit on a sheet (Full page 1, 4×6 2, 5×7 2, 8×10 1, 3½×5 4, Wallet 9). Only depart from it where it was weak, such as letting you choose the crop, or where the owner has decided to. A rule of our own that makes the app behave differently from Windows 7 needs that decision first; don't add one on our own judgement.

This replaces an earlier rule of ours, now removed, that left a ¼ in gap between photos for cutting and squeezed extra photos onto a page by turning some of them. It gave counts Windows 7 doesn't (three 4×6s, eight wallets) for no real gain: photos edge to edge are cut apart with one cut between them.

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

