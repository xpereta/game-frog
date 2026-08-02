# AGENTS.md — Tongue Catch

One-button frog tongue-catching game. Vite + TypeScript + Vitest, single
`<canvas>`, no game engine, no framework. Goal: delight, not competition —
no numeric score, no game over, no win/lose text.

## Commands

```bash
npm run dev        # local dev server (Vite)
npm run typecheck  # tsc --noEmit
npm run test       # vitest run (50 tests)
npm run build      # tsc && vite build
npm run preview    # preview the production build
```

Always run `npm run typecheck && npm run test && npm run build` after changes.

## Deploy

- GitHub repo: **xpereta/game-frog** (public — required for Pages on this plan).
- Live URL: **https://xpereta.github.io/game-frog/**
- Auto-deploys on push to `main` via `.github/workflows/deploy-pages.yml`
  (GitHub Actions → Pages). `vite.config.ts` uses `base: "./"` for subpath hosting.

## Architecture

| File | Role |
| --- | --- |
| `src/consts.ts` | `W=800`, `H=600`, `TONGUE_SPEED=600`, `TONGUE_REACH=430`, `FROG_X`, `FROG_Y`, `FROG_R`, `WATER_Y=500`; fatness tunables `FATNESS_CAP=15`, `FATNESS_WIDTH_MAX=2.2`, `FATNESS_HEIGHT_MAX=1.3`, `FATNESS_EASE=4`, `AURA_MIN_FATNESS=0.8`, `AURA_SPAWN_INTERVAL=0.15`, `EAT_POP_DURATION=0.35`, `EAT_POP_WIDTH=0.22`, `EAT_POP_HEIGHT=0.12`; frog sprite res `FROG_SPRITE=1024`, `FROG_SPRITE_FONT=704` |
| `src/main.ts` | Canvas setup, DPR scaling, input (`Space`/`window` pointerdown fire, debug keys), audio unlock listeners |
| `src/game.ts` | `Game` class: loop, states (`idle`/`happy`/`sad`), particles, grabbed bugs, sun, pond, HUD |
| `src/tongue.ts` | Tongue state machine + geometry: `createTongue`, `fireTongue`, `updateTongue(t, dt, carry)`, `mouthY()`, `altitudeFor(y)`, `tongueTipY(t)`, `tongueHitsBug` |
| `src/bugs.ts` | Bug species config + behavior: `spawnBug`, `updateBug`, `bugY`, `isOffScreen`, `bugRenderTransform`, `grabbedY` override |
| `src/frog.ts` | Frog/tongue drawing + animation curves: `drawFrog`, `drawTongue` (sneak wave), `happyJumpOffset`, `happyRotation`, `blinkScale`, `hopPulseScale`, `frogFatness`, `frogWidthScale`, `frogHeightScale`, `easeFatness` (smooth inflate/deflate), `eatPopScale`. Emoji glyphs are pre-rendered to offscreen sprites (`getFrogSprite`/`drawGlyphSprite`) and composited with `drawImage` — per-frame `fillText` of color emoji under non-uniform/rotating transforms re-rasterizes every frame and pegs CPU on Chrome/macOS (do not regress) |
| `src/audio.ts` | Procedural Web Audio: `Sound` class — `playLunge`, `playGrab(species)`, `playCatchFor(species)`, `playReach(alt)`, `playMiss`, `playMaxFat`, `unlock`, private `ensureRunning`/`recreate`/`enableIOSSession`/`prime`, `pluck`/`thump` |
| `src/hud.ts` | Streak rank emojis: `rankForStreak`, `bestStreakAfter`, `drawHud` |

## Current gameplay mechanics

- **One input** (space / click / tap) fires the tongue straight up from the
  frog's mouth at `TONGUE_SPEED`.
- **Grab phase (extend):** while extending, the tongue latches onto any bug its
  tip touches (`tongueHitsBug`). Grabbed bugs leave the swarm and ride the
  tongue tip (pinned to `tongueTipY`, spread ±16px apart). Grab fires
  `playGrab(species)` + reach rewards (see below). Tongue still extends to full
  reach, grabbing every bug in its path (multi-catch).
- **Swallow phase (retract):** retract runs at `TONGUE_SPEED * 1` while
  carrying, `* 2` when empty. Grabbed bugs **fade out over the last 70px** as
  they approach the mouth (`dist / 70` alpha in render). When the tip reaches
  `mouthY() - 14` the catch lands: burst at the frog, species jingle, happy
  jump, splash, streak increment.
- **Miss:** tongue completes a full cycle with no bugs → sad face ~1.1s, streak
  reset. Sad is gated on `grabbed.length === 0` (carrying bugs never triggers it).
- **Multi-catch (2+ in one throw):** upgraded celebration — higher jump
  (~95px), hover at peak during spin, never dips below rest, full 360° rotation
  done by 60% of the happy window. Tracks `caughtThisLunge` (per-throw counter,
  reset in `fire`) and `lastCatchCount`.
- **Reach rewards:** `alt = altitudeFor(y)`; `alt >= 0.5` → `playReach(alt)`
  sparkle ping layered over the jingle; `alt >= 0.85` → gold 4-point star
  particles + sun flare.
- **Sun reacts** while the frog is happy: winks (first 25%), big smile, brighter
  glow, faster-spinning rays that also grow (`1.55 - 0.35*happyP`).
- **Water splashes** at the lily pad on frog takeoff (small) and landing
  (bigger), detected via `happyJumpOffset` + `frogAirborneMs`.
- **HUD:** streak rank 🐣 → 🐤 → 🐸 → 🐉 with dots, best under 🏆. No numbers.
- **Fat frog:** `streak` feeds `frogFatness(streak)` (0..1, full at
  `FATNESS_CAP`); the displayed fatness eases toward it (`easeFatness`,
  `FATNESS_EASE`), so a miss deflates the frog smoothly instead of snapping.
  The 🐸 glyph scales to `frogWidthScale`/`frogHeightScale`
  (×`FATNESS_WIDTH_MAX` wide at max). A swallow fires `eatPopAt` → `eatPopScale`
  squash-stretch.   Surrounding emojis (💧✨😄😝) are drawn under a uniform scale
  so they keep their aspect ratio while the frog alone stretches. Purely
  visual.
- **Max-fatness moment:** the first time the streak hits `FATNESS_CAP` each
  session → one-shot golden celebration (`playMaxFat` fanfare, gold burst,
  sun flare, and `celebrateMoment` upgrades the happy reaction to the big
  multi-catch jump/spin). While shown fatness is above `AURA_MIN_FATNESS`, the
  frog emits a gold sparkle aura every `AURA_SPAWN_INTERVAL`, fading out as a
  miss deflates it.
- **Debug keys** (`src/main.ts`): `Z` → `debugCatch(1)`, `X` → `debugCatch(2)`
  to test single and multi-catch without waiting for bugs.

## Conventions

- **No gratuitous inline comments.** JSDoc on exported functions is fine
  (explains curves/behavior); mirror existing style.
- Emoji + canvas shapes only — no image assets.
- No numeric score, no game over. Delight over competition.
- Audio must be procedural (Web Audio oscillators), unlocked on a user gesture.
- **Docs stay in sync:** any change that alters gameplay, architecture, input,
  audio, or commands must update the matching doc in the same change — `spec.md`
  (rules/feel/visuals) or this file (architecture table, mechanics). Behavior-
  neutral bug fixes need no doc update.

- **iOS zoom/pull-to-refresh are disabled on purpose** (game-breaking): viewport
  meta `maximum-scale=1, user-scalable=no`, `touch-action: none` and
  `overscroll-behavior: none` on `html, body`. Do not remove; it's what makes
  tap/pinch gestures play the game instead of zooming. The fire target is the
  whole window so the letterbox around the canvas is also a tap target.

## Audio gotchas (iOS Safari) — DO NOT regress

- Sound works on desktop Safari/Chrome; on iOS it needed: silent-buffer prime +
  non-awaiting `playLunge` + first-gesture unlock. Currently working on iOS.
- Known flaky areas, do not reintroduce:
  - `pointerdown` is an unreliable unlock gesture on iOS; `main.ts` unlocks on
    a `pointerdown`/`touchend`/`click`/`mousedown`/`keydown` set — keep them.
  - iOS **ringer/mute switch silences WebAudio** — handled by
    `Sound.enableIOSSession()`: a silent looping `<audio>` element plus
    `navigator.audioSession.type = "playback"` (Safari iOS 17+).
  - iOS 18+ `AudioContext.resume()` can leave the context `"suspended"`/non-
    standard `"interrupted"` — handled by `Sound.ensureRunning()`/`recreate()`:
    if `resume()` hasn't flipped the state to `"running"`, the stuck context
    is closed and recreated on the next user gesture.
- **User rejected altitude-scaled pitch/loudness of the catch jingle twice.**
  Keep the jingle fixed; reach is a separate sparkle layer (`playReach`), never
  change the jingle's pitch by altitude.
