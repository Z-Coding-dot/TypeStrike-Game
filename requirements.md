# TYPESTRIKE — V1.0 PRODUCT & ENGINEERING REQUIREMENTS

## 1. PROJECT OVERVIEW

**Project Name:** TypeStrike  
**Product Type:** Bilingual arcade typing game  
**Release:** V1.0  
**Platform:** Responsive web application (desktop, tablet, and mobile)  
**Languages:** English and Persian  
**Authentication:** None for public players  
**Primary Goal:** Build an enjoyable, visually impressive typing game that improves users' typing speed and accuracy through arcade-style gameplay.

### Core Concept

TypeStrike is a futuristic 2D arcade typing game.

The player controls a spaceship equipped with a futuristic energy cannon. Words, letters, and sentences appear as moving targets and approach the player's spaceship.

The player must type the displayed content correctly. Once a target is completed correctly, the spaceship fires a visual energy projectile toward it, destroys it with an animation, and reads the completed text aloud.

The game becomes progressively harder as the player advances through levels.

The application must support English and Persian from the beginning.

---

# 2. MANDATORY UI/UX DESIGN SKILL

## UI UX Pro Max — REQUIRED

Repository:
https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The development agent MUST use the UI UX Pro Max skill for all visual design and UI/UX implementation.

Do not ignore this requirement or replace the skill with generic design decisions.

### Installation

If the skill is not already installed and available to the agent, use:

```bash
npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max
```

Do not reinstall an already available skill.

### Required workflow

Before implementing the interface:

1. Read and follow the skill's SKILL.md instructions.
2. Inspect the project's existing structure and dependencies.
3. Generate a complete design system using the skill's design-system workflow.
4. Search the skill's design references for:
   - Futuristic arcade game interfaces.
   - Dark minimal interfaces.
   - Neon color systems.
   - Gaming dashboard patterns.
   - Typography suitable for English and Persian.
   - Full RTL compatibility.
   - Responsive web layouts.
   - Animation and interaction patterns.
5. Use the skill's Next.js and React implementation guidelines.
6. Apply the generated design system consistently to all components.
7. Validate the finished interface against the skill's UX and accessibility checklist.

Example design-system workflow:

```bash
python3 <SKILL_ROOT>/scripts/search.py \
  "arcade typing game futuristic minimal dark neon" \
  --design-system \
  --persist \
  -p "TypeStrike" \
  --output-dir "."
```

Resolve `<SKILL_ROOT>` from the actual installed skill location. Do not invent its filesystem path.

If Python is unavailable, request installation rather than silently installing software.

### Design direction

Use a minimal futuristic arcade aesthetic.

Visual characteristics:

- Deep dark backgrounds.
- Subtle neon cyan and electric blue.
- Controlled purple accents.
- Clean typography.
- Subtle glowing borders.
- Sophisticated shadows.
- Smooth transitions.
- Minimal visual clutter.
- Clear visual hierarchy.
- Professional gaming interface.

Avoid:

- Excessive gradients.
- Excessive glassmorphism.
- Unnecessary decorations.
- Random colors.
- Oversized headings.
- Generic template-looking interfaces.
- Excessive animations that reduce performance.
- Emoji used as interface icons.

Use Lucide icons or consistent SVG icons.

---

# 3. TECHNOLOGY STACK

Use the following stack unless a genuine technical incompatibility requires an alternative.

| Technology | Responsibility |
|---|---|
| Next.js (App Router) | Application framework |
| React | UI components |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Phaser 3 | 2D game engine |
| Zustand | Game state management |
| Framer Motion | UI animations |
| Web Speech API | Text-to-speech |
| LocalStorage | Local player statistics and preferences |
| Vitest | Unit testing |
| Playwright | Browser testing |

Use stable, compatible package versions.

Do not install unnecessary libraries.

### Architecture principles

- Reusable components.
- Separation of concerns.
- Modular game logic.
- Strong TypeScript typing.
- Maintainable folder structure.
- Reusable design tokens.
- Clean code.
- No unnecessary duplication.
- No giant components.
- No unnecessary global state.
- No business logic inside presentation components.

Use Phaser for the game scene and React for menus, settings, controls, and the typing interface.

The typing input must remain a real HTML input element rather than relying exclusively on Phaser keyboard events.

---

# 4. PROJECT STRUCTURE

Use a clean, scalable folder structure similar to:

```text
typestrike/
│
├── public/
│   ├── fonts/
│   │   ├── vazirmatn/
│   │   └── inter/
│   ├── images/
│   │   ├── backgrounds/
│   │   └── spaceship/
│   ├── sounds/
│   │   ├── effects/
│   │   └── interface/
│   └── icons/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── game/
│   │   │   └── page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AdSlot.tsx
│   │   │
│   │   ├── game/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── Spaceship.tsx
│   │   │   ├── Target.tsx
│   │   │   ├── TypingInput.tsx
│   │   │   ├── GameHUD.tsx
│   │   │   ├── GameMenu.tsx
│   │   │   ├── GameOver.tsx
│   │   │   ├── LevelComplete.tsx
│   │   │   └── GameResults.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── ModeSelector.tsx
│   │   │   └── SettingsPanel.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── AnalyticsChart.tsx
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── ProgressBar.tsx
│   │       └── IconButton.tsx
│   │
│   ├── game/
│   │   ├── engine/
│   │   │   ├── GameEngine.ts
│   │   │   ├── GameScene.ts
│   │   │   └── TargetManager.ts
│   │   │
│   │   ├── systems/
│   │   │   ├── CollisionSystem.ts
│   │   │   ├── ScoringSystem.ts
│   │   │   ├── LevelSystem.ts
│   │   │   ├── DifficultySystem.ts
│   │   │   └── SpeechSystem.ts
│   │   │
│   │   └── utils/
│   │       ├── textNormalization.ts
│   │       ├── wordValidation.ts
│   │       └── gameCalculations.ts
│   │
│   ├── data/
│   │   ├── en/
│   │   │   ├── letters.json
│   │   │   ├── words.json
│   │   │   └── sentences.json
│   │   └── fa-AF/
│   │       ├── letters.json
│   │       ├── words.json
│   │       └── sentences.json
│   │
│   ├── hooks/
│   │   ├── useGame.ts
│   │   ├── useLanguage.ts
│   │   ├── useSpeech.ts
│   │   └── useLocalStats.ts
│   │
│   ├── stores/
│   │   ├── gameStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── lib/
│   │   ├── analytics.ts
│   │   ├── storage.ts
│   │   └── constants.ts
│   │
│   ├── types/
│   │   ├── game.ts
│   │   ├── language.ts
│   │   └── analytics.ts
│   │
│   └── styles/
│       └── design-tokens.css
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── design-system/
│
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── requirements.md
└── README.md
```

Adjust the structure if necessary, but maintain clear separation between game engine, UI, data, and business logic.

---

# 5. APPLICATION PAGES

## 5.1 Home Page

Create a beautiful and functional landing page.

Required elements:

- TypeStrike logo and brand name.
- Short description of the game.
- Play Now button.
- English/Persian language selector.
- Three game mode previews.
- How to Play section.
- Game features.
- Footer.

The landing page should be visually attractive but should not distract users from starting the game.

No registration or login requirement.

## 5.2 Game Page

This is the most important page.

The game should be the central visual element.

Required interface:

- Top navigation.
- Language selector.
- Current level.
- Current score.
- Remaining lives.
- Typing speed (WPM).
- Accuracy percentage.
- Game timer.
- Main game scene.
- Typing input.
- Pause/resume controls.
- Sound and speech settings.
- Current mode indicator.

The gameplay area must have sufficient width and height.

Do not make the game scene too small.

## 5.3 Results Page / Results Modal

After a game ends, show:

- Final score.
- Highest level reached.
- Total targets completed.
- Correct characters.
- Incorrect characters.
- Accuracy.
- Average WPM.
- Best WPM.
- Game duration.
- Restart button.
- Return to home button.

Keep results locally for future comparison.

---

# 6. GAME MODES

Implement three independent game modes.

## MODE 1: LETTER STRIKE

The player types individual letters appearing as targets.

Requirements:

- Display individual English or Persian characters.
- Validate the entered character.
- Destroy the target after a correct entry.
- Increase score.
- Increase difficulty with each level.
- Support Persian/Persian characters.

Do not assume that one visible character always equals one JavaScript string index. Use Unicode-aware grapheme handling.

## MODE 2: WORD STRIKE

The player types complete words.

Requirements:

- Generate words from the selected language dataset.
- Show several moving word targets.
- Allow the player to select a target by typing its complete word.
- Validate the full word.
- Fire an energy projectile after a successful match.
- Destroy the target.
- Award points.
- Spawn new words.

Do not force users to type an unrelated word that is not currently displayed.

Implement an unambiguous target-selection system. When multiple targets are active, allow matching any active target by its complete text.

## MODE 3: SENTENCE STRIKE

The player types complete sentences.

Requirements:

- Display sentences as moving targets.
- Validate complete sentences.
- Support spaces and punctuation.
- Preserve correct Persian RTL rendering.
- Destroy completed sentences with an animation.
- Award higher scores.
- Gradually increase sentence complexity.

Sentence mode must be comfortable to use on mobile screens.

---

# 7. PROGRESSIVE LEVEL SYSTEM

The game must have an automatic level progression system.

There should be no fixed maximum level.

Each completed level increases difficulty.

### Level progression

Use configurable level parameters.

Example initial balancing:

| Level | Word targets per level | Maximum simultaneous targets | Movement speed |
|---|---:|---:|---|
| 1 | 6 | 2 | Slow |
| 2 | 8 | 2 | Slow |
| 3 | 10 | 3 | Moderate |
| 4 | 12 | 3 | Moderate |
| 5 | 14 | 4 | Faster |
| 6+ | Gradually increase | Gradually increase | Progressively harder |

These values are initial tuning parameters, not hard-coded limitations.

### Difficulty progression

As the level increases:

1. Targets move faster.
2. More targets appear.
3. Words become longer.
4. Less common vocabulary appears.
5. Sentences become longer.
6. Punctuation and more complex sentence structures are introduced.
7. Spawn intervals become shorter.

The difficulty system must be configurable.

Avoid sudden, unfair difficulty jumps.

### Level completion

When the required number of targets has been destroyed:

- Stop spawning new targets.
- Complete or clear the remaining targets according to a consistent rule.
- Show a level-completed animation.
- Display the next level.
- Allow the next level to start.
- Increase difficulty.

Apply level progression consistently across all three game modes.

Use different target quotas for letter, word, and sentence modes.

---

# 8. PLAYER, SPACESHIP AND GAME ENVIRONMENT

### Player

The player controls a futuristic spaceship with a visual energy cannon.

Visual requirements:

- 2D spaceship.
- Neon blue/cyan energy details.
- Subtle idle animation.
- Energy charging effect.
- Firing animation.

### Environment

Use a minimal dark neon environment.

Requirements:

- Deep navy or near-black background.
- Subtle stars or particles.
- Soft environmental glow.
- Neon target labels.
- Clearly visible target movement paths.
- Good text readability.

Do not overcrowd the scene.

### Target movement

Targets should appear at the far side of the game scene and move toward the player's spaceship.

Requirements:

- Smooth movement.
- Different movement speeds based on difficulty.
- No unintended target overlap.
- Clear visual distinction between active and completed targets.
- Targets must remain readable.
- Targets that reach the player's danger boundary must trigger a life loss.

### Successful typing animation

When a target is completed:

1. Validate the text.
2. Trigger the spaceship's firing animation.
3. Display a moving neon energy projectile.
4. Connect the projectile visually to the completed target.
5. Trigger a particle explosion.
6. Remove the target.
7. Update score and combo.
8. Read the completed text aloud.

Animations must be smooth and must not block the typing experience.

---

# 9. LIVES AND GAME OVER

Every new game begins with three lives.

Requirements:

- Display three clearly visible life indicators.
- Lose one life whenever a target reaches the player's danger boundary.
- Incorrect typing alone should not remove a life.
- When lives reach zero, stop gameplay.
- Stop target spawning.
- Stop movement.
- Display the Game Over screen.
- Show the final results.
- Allow replay.

The life system must be consistent across all game modes.

---

# 10. SCORING SYSTEM

Create a centralized scoring system.

Initial scoring:

| Action | Points |
|---|---:|
| Correct letter | 10 |
| Correct word | 100 |
| Correct sentence | 250 |
| Level completion | 300 bonus |
| Accuracy bonus | Configurable |
| Combo bonus | Configurable |

Longer and more difficult targets may receive additional points.

Do not award points for incorrect answers.

### Combo system

- Consecutive correct targets increase the combo.
- Missing a target resets the combo.
- Display a small visual combo indicator.
- Apply a controlled score multiplier.

### Statistics

Calculate:

- WPM.
- Accuracy.
- Correct characters.
- Incorrect characters.
- Targets completed.
- Total score.
- Game duration.

WPM must be calculated using correctly typed characters and the conventional five-character word definition.

Accuracy must be based on actual typing attempts, not simply completed targets.

---

# 11. Persian AND ENGLISH LANGUAGE SUPPORT

THIS IS A CRITICAL REQUIREMENT.

Persian support must be implemented correctly throughout the entire application, not just in the language selector.

### Supported languages

English:
- Locale: en
- Direction: LTR

Persian:
- Locale: fa-AF
- Direction: RTL

Do not add additional player-facing languages in V1.0.

### Persian typography

Use a high-quality font with complete Persian-script coverage.

Preferred font:
- Vazirmatn for Persian.

Use Inter for English.

Ensure fonts load correctly and do not fall back to unreadable default fonts.

### Required Persian characters

Explicitly test:

ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی

Also test:

- ء
- آ
- ؤ
- ئ
- Persian numerals where used.
- Spaces.
- Punctuation.
- Zero-width non-joiner (ZWNJ).

### RTL requirements

When Persian is selected:

- Set the appropriate document language.
- Set the page direction to RTL.
- Correctly align navigation.
- Correctly align headings.
- Correctly align buttons and labels.
- Correctly render target words.
- Correctly render sentences.
- Correctly display the typing input.
- Correctly render modal content.
- Correctly align results.
- Correctly display the footer.
- Correctly handle mixed English and Persian text.

Use appropriate direction isolation for mixed-language content.

Do not simply reverse strings.

Do not manually reverse arrays of characters to simulate RTL.

### Unicode handling

Create a dedicated text-normalization utility.

Requirements:

- Normalize Unicode consistently using NFC.
- Handle Arabic kaf and Persian kaf consistently.
- Handle Arabic yeh and Persian yeh consistently.
- Handle whitespace carefully.
- Preserve punctuation.
- Preserve ZWNJ where it is meaningful.
- Handle Unicode grapheme clusters correctly.
- Never compare Persian text using unreliable ASCII-based logic.

Do not perform aggressive normalization that changes the meaning of Persian words.

### Input validation

Persian typing must work using actual Persian/Persian keyboard layouts.

Support:

- Windows.
- Android.
- iOS.
- Modern desktop browsers.

Handle browser input composition events correctly.

Do not validate partially composed text during an active input composition session.

### Direction isolation

Use `dir="rtl"` for Persian content and `dir="ltr"` for English content.

For mixed-language UI elements, use `dir="auto"` or appropriate directional isolation.

Avoid using global RTL rules that break numbers, English text, icons, or the game layout.

### Language datasets

Create meaningful initial datasets.

English:
- At least 100 words.
- At least 30 sentences.

Persian:
- At least 100 words.
- At least 30 sentences.

Persian content must be natural, grammatically correct, and appropriate for Persian speakers.

Do not translate every English example mechanically.

Use authentic Persian vocabulary and sentence structures.

Organize the datasets by difficulty.

---

# 12. TEXT-TO-SPEECH SYSTEM

The game must read each successfully completed target aloud.

Use the browser Web Speech API as the initial speech provider.

Create a reusable SpeechSystem.

### Expected behavior

When the player successfully completes:

- A letter: pronounce the letter.
- A word: pronounce the completed word.
- A sentence: read the complete sentence aloud.

Speech should happen after successful target completion, not on every keystroke.

### Language behavior

English:
- Prefer an available en-US or suitable English voice.

Persian:
- Prefer an available prs-AF voice.
- If unavailable, check compatible fa-AF or fa-IR voices.
- Never pretend that an unsupported voice is available.
- Never silently pronounce Persian using an unrelated English voice.

### Important browser limitation

Available voices depend on the operating system, browser, and installed speech services.

Implement:

- Voice availability detection.
- Voice selection.
- `voiceschanged` handling.
- Speech queue management.
- Speech cancellation when appropriate.
- Error handling.
- A speech on/off setting.
- Speech volume and rate controls.

If a suitable Persian voice is unavailable:

- Keep the game fully functional.
- Display a clear notification.
- Provide an option to continue without speech.
- Keep the speech system modular so a future Persian-capable TTS provider can be integrated.

Do not block gameplay while speech is playing.

Speech must never interfere with typing input.

---

# 13. RESPONSIVE DESIGN

The application must be designed mobile-first and work correctly on:

- Small mobile screens.
- Large mobile screens.
- Tablets.
- Laptops.
- Desktop monitors.

### Desktop

Use a three-column layout:

| Left | Center | Right |
|---|---|---|
| Advertisement slot | Main game | Advertisement slot |

The game must receive the majority of the available horizontal space.

### Tablet

- Reduce or remove side advertising slots depending on available width.
- Keep the game centered.
- Prevent horizontal overflow.

### Mobile

- Hide left and right advertisement slots.
- Use the full available game width.
- Place advertising below the game or in appropriate non-interruptive sections.
- Keep the typing input accessible.
- Make buttons touch-friendly.
- Prevent overlapping controls.
- Adapt the game scene to the viewport.
- Support portrait and landscape orientations.

### Responsive requirements

- No horizontal page scrolling.
- No clipped Persian text.
- No overlapping target words.
- No clipped buttons.
- No inaccessible typing input.
- No fixed desktop-only dimensions.
- Use responsive CSS and dynamic viewport units appropriately.
- Respect mobile safe areas.

All touch targets should preferably be at least 44 × 44 CSS pixels.

---

# 14. ADVERTISEMENT ARCHITECTURE

Advertising is part of the future business model.

For V1.0, create reusable advertisement placeholders.

Do not integrate live advertisements yet.

### Advertisement slots

Create an AdSlot component with configurable placement.

Required placements:

- Desktop left sidebar.
- Desktop right sidebar.
- Bottom banner.
- Optional content-page advertisement.

### Important rules

- Ads must never cover the game.
- Ads must never cover typing inputs.
- Ads must never interrupt active gameplay.
- Ads must never cause layout shifts.
- Mobile must not display desktop sidebars.
- Advertisement containers must be easy to integrate with an advertising provider later.

Keep the advertising implementation separate from the game engine.

---

# 15. ANALYTICS AND ADMIN DASHBOARD

The public game must not require registration or login.

There must be no public player signup or login page.

However, the project should prepare for website analytics and a private owner dashboard.

### Analytics events

Create an analytics abstraction to track:

- Page views.
- Game starts.
- Game completions.
- Game mode selections.
- Language selections.
- Levels reached.
- Game duration.
- Advertisement impressions when ads are introduced.

Avoid collecting unnecessary personal information.

Do not collect raw keystrokes or the actual text typed by players.

### Dashboard

Create a private `/admin` dashboard architecture.

Possible metrics:

- Total page views.
- Unique visitors.
- Game sessions.
- Games completed.
- Average session duration.
- English vs Persian usage.
- Game mode popularity.
- Average levels reached.
- Device categories.
- Advertisement statistics when available.

### Authentication

Public players must never need authentication.

The owner dashboard must be protected with server-side authentication.

Do not create an insecure hardcoded frontend password.

Use a proper authentication approach when implementing the private dashboard.

### V1.0 scope

- Implement the dashboard layout.
- Implement analytics event interfaces.
- Connect configured analytics providers where credentials are available.
- Display real data only.
- Show clear empty states when analytics are not configured.
- Never fabricate visitor counts or revenue.

Centralized analytics and advanced reporting can be extended in a later release.

---

# 16. LOCAL STORAGE AND PLAYER EXPERIENCE

No public player accounts.

Use LocalStorage to remember:

- Selected language.
- Sound preferences.
- Speech preferences.
- Highest score.
- Highest level.
- Personal game statistics.
- Preferred game mode.

Provide a way to reset local game statistics.

Handle unavailable or disabled LocalStorage gracefully.

Do not store sensitive information.

---

# 17. ANIMATIONS AND AUDIO

Animations are essential to the game experience.

Use Phaser for gameplay animations and Framer Motion for React UI transitions.

### Required animations

- Spaceship idle animation.
- Spaceship firing animation.
- Energy projectile movement.
- Target movement.
- Target destruction.
- Particle effects.
- Score counter transitions.
- Combo animation.
- Level completion animation.
- Game Over transition.
- Button hover and press effects.
- Modal transitions.
- Progress bar animations.

### Audio effects

Prepare sound effects for:

- Target destruction.
- Level completion.
- Losing a life.
- Game Over.
- Button interactions.

Provide independent controls for sound effects and text-to-speech.

Do not autoplay sound before the user interacts with the page.

Respect reduced-motion preferences.

Keep animations performant and avoid excessive particle creation.

---

# 18. GAME SETTINGS

Provide a settings panel with:

- Language selection.
- Game mode selection.
- Sound effects on/off.
- Speech on/off.
- Speech speed.
- Speech volume.
- Animation preference.
- Restart game.
- Reset local statistics.

Settings must be easy to access without leaving the active game unnecessarily.

---

# 19. ACCESSIBILITY AND USABILITY

Implement:

- Semantic HTML.
- Keyboard accessibility.
- Visible focus states.
- Sufficient contrast.
- Proper button labels.
- Screen-reader-friendly controls.
- Appropriate input labels.
- Reduced-motion support.
- Clear error messages.
- Readable typography.
- Accessible game instructions.

Do not rely on color alone to communicate game states.

The typing input must remain usable with assistive technologies.

---

# 20. PERFORMANCE REQUIREMENTS

The game must run smoothly.

Requirements:

- Optimize Phaser rendering.
- Avoid unnecessary React re-renders.
- Clean up event listeners.
- Destroy game instances correctly.
- Prevent duplicate animation loops.
- Manage target objects efficiently.
- Avoid excessive particle generation.
- Lazy-load nonessential components.
- Optimize images and fonts.
- Prevent memory leaks.
- Keep game logic separate from UI rendering.

Aim for smooth 60 FPS on capable devices, while adapting gracefully to slower hardware.

The application must remain usable on average mobile devices.

---

# 21. TESTING REQUIREMENTS

Do not consider the project complete merely because the development server starts.

Create meaningful automated tests.

### Unit tests

Test:

- Unicode normalization.
- English word validation.
- Persian word validation.
- Persian character handling.
- Sentence validation.
- Scoring.
- Accuracy calculations.
- WPM calculations.
- Level progression.
- Life management.
- Speech voice selection.

### Browser tests

Test:

1. Home page loads.
2. Game starts without login.
3. English language works.
4. Persian language works.
5. All three game modes work.
6. Correct typing destroys a target.
7. Incorrect typing does not award points.
8. Targets approaching the player reduce lives.
9. Three lost lives trigger Game Over.
10. Level completion increases difficulty.
11. Restart works.
12. Speech settings work.
13. Mobile input works.
14. RTL rendering works.
15. Responsive layouts work.

### Persian-specific tests

Explicitly test words containing:

پ، چ، ژ، گ، ک، ی

Test sentences with spaces, punctuation, and ZWNJ.

Test actual input using a Persian keyboard layout.

Do not approve the Persian implementation based only on screenshots.

---

# 22. V1.0 DEVELOPMENT PHASES

Build the project incrementally.

### Phase 1 — Project foundation

- Initialize Next.js.
- Configure TypeScript.
- Configure Tailwind CSS.
- Install required dependencies.
- Integrate UI UX Pro Max.
- Generate the design system.
- Establish project architecture.
- Implement responsive application layout.

### Phase 2 — Game engine

- Integrate Phaser.
- Create the spaceship.
- Create moving targets.
- Implement target movement.
- Implement typing input.
- Implement target matching.
- Implement projectile and destruction effects.

### Phase 3 — Game mechanics

- Implement all three modes.
- Implement scoring.
- Implement lives.
- Implement Game Over.
- Implement level progression.
- Implement difficulty scaling.

### Phase 4 — Language support

- Create English datasets.
- Create Persian datasets.
- Implement RTL.
- Implement Unicode normalization.
- Test Persian-script input.
- Implement speech functionality.

### Phase 5 — User experience

- Implement animations.
- Implement sound effects.
- Implement settings.
- Implement responsive layouts.
- Implement local statistics.
- Implement advertisement placeholders.

### Phase 6 — Analytics foundation

- Implement analytics abstraction.
- Create the admin dashboard structure.
- Add protected dashboard access.
- Add real-data and unconfigured states.

### Phase 7 — Testing and delivery

- Run TypeScript checks.
- Run linting.
- Run unit tests.
- Run browser tests.
- Test mobile layouts.
- Test Persian rendering and typing.
- Fix all critical issues.
- Update README.md.

---

# 23. ACCEPTANCE CRITERIA

V1.0 is considered complete only when all the following conditions are met.

### Product

- [ ] TypeStrike is functional.
- [ ] No public login or signup exists.
- [ ] Players can immediately start playing.
- [ ] English and Persian are supported.
- [ ] Three game modes work.
- [ ] Progressive levels work.
- [ ] Difficulty increases correctly.
- [ ] Three-life system works.
- [ ] Game Over works.
- [ ] Results are displayed correctly.

### Gameplay

- [ ] Targets move toward the spaceship.
- [ ] Correct typing triggers an energy projectile.
- [ ] Completed targets disappear.
- [ ] Score updates correctly.
- [ ] Incorrect typing does not award points.
- [ ] WPM and accuracy are calculated correctly.
- [ ] No game-breaking overlapping targets.
- [ ] Restart works reliably.

### Language

- [ ] Persian uses proper RTL.
- [ ] All required Persian characters render correctly.
- [ ] Persian keyboard input works.
- [ ] ZWNJ handling is tested.
- [ ] Sentence punctuation is supported.
- [ ] English and Persian can be switched.
- [ ] Speech handles voice availability honestly.

### Design

- [ ] UI UX Pro Max was used.
- [ ] Design system is documented.
- [ ] Components are reusable.
- [ ] Responsive design works.
- [ ] Desktop, tablet, and mobile are tested.
- [ ] Animations are smooth.
- [ ] Interface is visually consistent.

### Business foundation

- [ ] Advertisement placeholders exist.
- [ ] Game analytics events are prepared.
- [ ] Admin dashboard is protected.
- [ ] No fake analytics data is displayed.
- [ ] No personal player registration is required.

### Engineering

- [ ] No critical TypeScript errors.
- [ ] No major console errors.
- [ ] No memory leaks.
- [ ] Unit tests pass.
- [ ] Browser tests pass.
- [ ] README contains setup and execution instructions.

---

# 24. DEVELOPMENT AGENT INSTRUCTIONS

These instructions are mandatory.

1. First inspect the repository and understand the existing project.
2. Read this entire requirements.md file before implementation.
3. Activate and use UI UX Pro Max before designing the interface.
4. Do not skip design-system generation.
5. Do not build the entire application inside one page component.
6. Use reusable components and modular architecture.
7. Implement real functionality, not static mockups.
8. Do not use placeholder data for core gameplay.
9. Do not ignore Persian support.
10. Do not sacrifice mobile usability for desktop design.
11. Do not add login or signup to the public game.
12. Do not introduce unnecessary backend dependencies.
13. Do not claim features work without testing them.
14. Do not silently remove requirements when encountering technical difficulties.
15. If a requirement cannot be implemented, explain the limitation and propose a technically sound alternative.
16. Keep the code maintainable and documented.
17. Update README.md with setup, development, testing, and deployment instructions.
18. Do not stop after creating the initial interface. Complete the actual gameplay loop.

### Final delivery

At completion, provide:

- Implemented feature summary.
- Final folder structure.
- Technologies and dependencies.
- Installation instructions.
- Development commands.
- Testing results.
- Known limitations.
- Future improvement recommendations.

**FINAL PRODUCT STANDARD:**

TypeStrike must feel like a professionally designed, polished, responsive arcade typing game — not a basic typing test with a dark background.

Gameplay quality, Persian language correctness, responsive usability, and maintainable architecture take priority over decorative effects.

Build a working V1.0, test it thoroughly, and do not mark it complete until the acceptance criteria have been verified.