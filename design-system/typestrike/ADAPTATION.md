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
