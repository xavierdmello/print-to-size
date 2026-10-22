/**
 * EXPERIMENT: throwaway UI test behind a dev-only switch (see README, "Experiments").
 * Not a pattern to build on. Delete it, or rebuild the winning idea properly in the core app.
 *
 * Picks out a photo that was just added, so the editor can play its crop-in animation once.
 * Nothing plays for people who've asked their system for less motion.
 */
import { useState } from 'react'
import type { PrintItem } from '../../state'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export function useCropIntro(items: readonly PrintItem[], enabled: boolean) {
  const [seen, setSeen] = useState(() => new Set(items.map((item) => item.id)))
  const [introId, setIntroId] = useState<string | null>(null)

  // Adjusting state while rendering, when the list of photos changes, as React recommends.
  const added = items.filter((item) => !seen.has(item.id))
  if (added.length > 0) {
    setSeen(new Set(items.map((item) => item.id)))
    if (enabled && !reducedMotion()) setIntroId(added[added.length - 1].id)
  }

  return { introId: enabled ? introId : null, endIntro: () => setIntroId(null) }
}
