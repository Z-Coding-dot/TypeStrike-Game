# TypeStrike

A bilingual (English / Persian(Dari)) arcade typing game. Type incoming letters,
words, and sentences to fire an energy cannon, destroy targets, and improve
speed and accuracy. Players can start immediately — there is no public signup
or login.

---

## 1. Implemented features

### Gameplay
- Phaser 3 game scene with a neon spaceship, starfield, energy cannon,
  projectiles, explosions, and targets moving toward a danger boundary.
- Three modes: **Letter Strike**, **Word Strike**, **Sentence Strike**, each with
  its own quotas and target selection by complete text.
- Real HTML `<input>` for typing (IME/composition aware), Escape to pause.
- Three lives; a life is lost only when a target crosses the danger line, never
  for a typing mistake. Three losses end the run and show full results.
- Unbounded, configurable level progression: more targets, faster movement,
  longer and less common vocabulary, and more complex sentences.
- Central scoring: 10/100/250 points per letter/word/sentence, 300-point level
  bonus, accuracy bonus, and a capped combo multiplier. WPM uses the
  conventional five-character word; accuracy is based on actual key attempts.
- Results screen with score, highest level, targets, correct/incorrect
  characters, accuracy, average/best WPM, duration, restart, and home actions.
- Locally synthesized WAV effects (destroy, level complete, life lost, game
  over, button hover/press) with independent sound and speech controls.

### Languages
- English (`en`, LTR) and Persian Dari (`fa-AF`, RTL) throughout the app.
- Vazirmatn for Persian and Inter for English, bundled locally.
- Document `lang`/`dir`, navigation, headings, modals, results, input, and
  Phaser target labels all follow the selected direction. Strings are never
  reversed.
- NFC normalization, Unicode grapheme segmentation, Arabic/Persian kaf and yeh
  equivalence for matching, preserved punctuation and meaningful ZWNJ, and
  composition-safe validation.
- Datasets: 145 English words / 42 sentences and 143 Persian words / 42
  sentences, organized into three difficulty tiers, plus letter sets including
  Persian-specific characters and ZWNJ.
- Web Speech API speech system with `prs-AF → fa-AF → fa-IR → fa` voice
  selection, `voiceschanged` handling, queue cancellation, rate/volume
  controls, and a clear notice instead of an English fallback when no Persian
  voice exists.

### Interface and platform
- Responsive mobile-first layout: side ad slots on desktop, centered game on
  tablet, full-width game and bottom ad on mobile; no horizontal overflow and
  at least 44 × 44 px touch targets.
- Reusable UI primitives, settings panel, animated transitions with Framer
  Motion, reduced-motion support, semantic markup, focus states, and screen
  reader labels.
- AdSlot placeholders for left, right, bottom, and content placements. They
  never overlay gameplay and are ready for a future ad provider.
- LocalStorage-backed preferences and statistics (language, mode, sound,
  speech, animations, high score, highest level, history) with graceful
  fallback when storage is unavailable, plus a statistics reset action.

### Analytics and owner dashboard
- Provider-agnostic analytics events for page views, game starts/completions,
  mode and language selections, levels reached, game duration, and ad
  impressions. Events never contain raw keystrokes or typed text.
- Optional Plausible connector. `/admin` is protected by server-side HTTP Basic
  auth via `src/proxy.ts` (Next.js 16 Proxy); access is denied when credentials
  are missing. The dashboard shows real provider data or an explicit empty
  state — never fabricated metrics.

---

## 2. Technology stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js 16.4 (App Router, React 19, TypeScript 5.9) |
| Styling | Tailwind CSS 4 with shared design tokens |
| Game | Phaser 3.90 |
| State | Zustand 5 |
| Animation | Framer Motion 14 |
| Icons | Lucide React |
| Speech | Browser Web Speech API |
| Storage | Browser LocalStorage |
| Tests | Vitest 5, Playwright 1.65 |
| Lint | ESLint 9 with Next.js flat config |

Design was produced with the **UI UX Pro Max** skill. See
`design-system/typestrike/MASTER.md` for the generated system,
`design-system/typestrike/ADAPTATION.md` for the requirements-driven override
(minimal futuristic neon, cyan/blue/purple on deep navy), and
`src/styles/design-tokens.css` for the tokens used by components.

---

## 3. Setup

Requirements: Node.js 20+ (22+ recommended) and npm 10+.

```bash
npm install
cp .env.example .env.local   # optional; needed only for /admin and analytics
npm run dev                  # http://localhost:3000
```

Fonts and sounds are bundled under `public/`, so no assets are downloaded at
runtime. Regenerate sound effects with `node scripts/generate-sounds.mjs`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Server-side credentials for `/admin`. If either is unset, access is denied. |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Set to `plausible` to enable event forwarding. |
| `NEXT_PUBLIC_ANALYTICS_SITE_ID` | Plausible site domain. |
| `ANALYTICS_API_TOKEN` | Optional server-only token for dashboard stats. |
| `ANALYTICS_BASE_URL` | Optional Plausible API base URL (defaults to `https://plausible.io`). |

Use long random credentials and serve `/admin` over HTTPS in production.

---

## 4. Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright desktop + mobile browser tests
npm run verify       # typecheck, lint, unit tests, and build
```

Playwright uses installed Google Chrome by default (`channel: "chrome"`). If
Chrome is not available, run `npx playwright install chromium` and set
`PLAYWRIGHT_CHANNEL=chromium`. `PLAYWRIGHT_BASE_URL` can point the suite at an
already running server.

---

## 5. Testing results

Verified on Node 22 / Windows with Next.js 16.4.6:

| Check | Result |
| --- | --- |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test` | 13 files, 71 tests passed |
| `npm run test:e2e` | 38 tests passed (19 × desktop + mobile) |
| `npm run build` | passed; 4 static routes, dynamic `/admin` |

Browser tests cover: home page, language/RTL switching, all three modes,
correct and incorrect typing, target destruction and scoring, life loss and
game over, level completion, restart, HUD speech toggle, Persian input, mobile
input, responsive layouts, admin protection, and uncaught console errors.

---

## 6. Final folder structure

```text
public/
  fonts/{inter,vazirmatn}/          locally bundled woff2 fonts
  sounds/{effects,interface}/       generated WAV effects
scripts/generate-sounds.mjs
src/
  app/                              layout, home, game, about, admin, 404, icon
  components/
    ui/                             Button, Card, IconButton, Modal, ProgressBar
    layout/                         Header, Footer, AdSlot, ClientProviders
    game/                           board, canvas, HUD, input, menus, results
    settings/                       language, mode, settings panel
    dashboard/                      admin layout, metrics, chart
  game/
    engine/                         GameEngine, GameScene, TargetManager
    systems/                        collision, scoring, level, difficulty, speech
    utils/                          text normalization, validation, calculations
  data/{en,fa-AF}/                  letters, words, sentences
  hooks/                            i18n, language, speech, sound, stats
  stores/                           game, settings, statistics
  lib/                              analytics, admin analytics, Plausible, i18n,
                                    constants, safe storage
  styles/design-tokens.css
  types/                            game, language, content, analytics
  proxy.ts                          Next 16 server-side /admin protection
tests/
  unit/{foundation,game,language,speech}/
  e2e/{home,game,rtl,responsive,admin}.spec.ts
design-system/typestrike/            generated design system + adaptation
```

---

## 7. Deployment

Build with `npm run build` and serve with `npm run start`, or deploy the Next.js
app to a platform such as Vercel. Set the environment variables above in the
hosting environment. No database or backend service is required for gameplay;
the only server-side requirement is the Proxy auth check for `/admin`.

---

## 8. Known limitations

- Speech quality depends on the operating system and browser voices. Persian
  pronunciation may be unavailable on some devices; the game stays playable and
  shows an explanatory notice rather than using an English voice.
- Browser automation cannot switch the OS keyboard layout. E2E tests insert
  Unicode Persian text (including ZWNJ) and verify it is preserved; testing with
  physical Persian keyboards on Windows, Android, and iOS is still recommended.
- Advertisement slots are placeholders only; no live ad network is connected.
- Statistics are per browser via LocalStorage. There are no player accounts or
  cross-device sync, by design.
- The `/admin` dashboard displays metrics only when an analytics provider is
  configured and reachable; otherwise it shows an empty state.

## 9. Recommended next steps

- Integrate a server-side Persian-capable TTS provider for consistent Dari
  pronunciation across platforms.
- Add a real advertising adapter behind the existing `AdSlot` boundary.
- Add more analytics providers and historical reporting once traffic exists.
- Expand and balance both datasets using real player telemetry (never raw
  keystrokes), then tune level curves from that data.
- Run a real-device accessibility and performance pass, especially for Persian
  keyboard layouts and low-end mobile GPUs.
- Add optional authenticated cloud sync if cross-device statistics become a
  product requirement.
