# Design decisions

Choices about the interface that were questioned and settled, with the reasoning, so they aren't undone by accident. Add new entries at the end.

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
