# TypeStrike design-system adaptation

The generated `MASTER.md` selected a pixel-art/retro arcade direction with a red
primary color, Press Start 2P and VT323. That conflicts with the explicit
product direction in `requirements.md` (minimal futuristic arcade, deep dark
backgrounds, neon cyan/electric blue, controlled purple, clean typography,
Inter + Vazirmatn, full RTL).

Per the skill workflow, `MASTER.md` was left untouched. This document records
the deliberate adaptation used by the implementation:

- **Kept from the skill result:** Minimalism & Swiss Style (verified
  `rtl_level: full`), grid-based layout, clear type hierarchy, subtle
  200–250 ms hover transitions, sharp/subtle shadows, no emoji icons, visible
  focus states, reduced-motion support, responsive 375/768/1024/1440 checks.
- **Overridden by explicit requirements:** palette (cyan `#22D3EE` primary,
  electric blue `#3B82F6` secondary, purple `#8B5CF6` accent on `#050B14`),
  typography (Inter for English, Vazirmatn for Persian), and no pixel fonts.
- **Source of truth for code:** `src/styles/design-tokens.css`. Tailwind
  theme variables are mapped from these tokens in `src/app/globals.css`.

Any future redesign should update `MASTER.md` through the skill with explicit
user authorization, then regenerate the token files.

## Carbon-inspired system refinement

The shell UI was then aligned with IBM Carbon's *patterns*, not its branding:

- **Role-based tokens.** `src/styles/design-tokens.css` now has an explicit
  primitive layer (palette, type, spacing, radii, motion, layout) and a semantic
  role layer: `layer-*`, `border-*`, `text-*`, `action-*`, `status-*`, `focus-*`.
  Components consume roles; raw brand colors stay in the primitive layer. The
  original `ts-*` names remain as compatibility aliases for the game canvas.
- **2x-grid discipline.** Layout uses an 8px rhythm (`--space-unit`) with 4px
  half-steps only for optical alignment. Section spacing, card padding and
  control heights (`--touch-target: 44px`) share the same scale.
- **Productive vs expressive type.** Admin, settings, navigation and dialogs
  use the compact type scale. Only the landing hero uses expressive sizing
  (`--type-display` range); headings elsewhere stay in the productive range.
- **UI shell and patterns.** A single navigation shell serves every breakpoint:
  the hamburger is always available and opens a keyed dialog-style drawer with
  backdrop, Escape handling, focus return, scroll lock and route-change
  dismissal. Inline desktop links are supplementary. Buttons, cards and the
  modal follow one flat-surface pattern with visible focus rings.
- **Restraint.** Surfaces are flat; gradients, backdrop blur, decorative
  circles/crosshairs and glow shadows were removed from shell components.
  Cyan remains the single action accent, with blue/purple reserved for charts
  and status. Elevation is limited to functional dialogs and menus.
- **Accessibility and RTL.** Contrast target is >= 4.5:1 for body text, focus
  is always visible, transitions are ~200ms with reduced-motion support, and
  layout uses logical properties (`inset-inline-*`, `ms-*`, `text-start`).
  Brand strings and numeric/mixed strings are direction-isolated (`dir="ltr"`,
  `unicode-bidi: isolate`) without reversing translated copy.

`design-system/typestrike/tokens.css` and `tokens.json` are synchronized mirrors
of the live stylesheet; `MASTER.md` remains untouched by this adaptation.
