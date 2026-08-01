# Tongue Catch — Spec

A one-button web game where a frog at the bottom of the screen catches bugs
with its tongue. No score, no lives, no fail state — built to delight, not to
compete.

## Rules

- Press **space** (or click/tap the canvas) to make the frog's tongue lunge
  straight up from its mouth at a **constant speed**.
- The tongue extends to its full reach, then retracts. A bug caught while the
  tongue is extending is eaten.
- Bugs (fly, ladybug, bee) spawn from the left/right edges at random heights,
  fly across at species-specific speeds/directions with a slight wobble, and
  despawn off the far edge. Spawning never stops.
- No score. No game over. Misses have no consequence beyond a brief sad face
  and a streak reset.

## Feel targets

- Tongue speed is constant and identical in both directions (snappy, readable).
- Catch window is generous: the tongue tip can touch a bug anywhere along its
  reach column.
- Every catch rewards the player:
  - a **species-specific procedural jingle** (Web Audio, randomized so it
    sounds different each time),
  - the frog looks **happy** for ~2 seconds (sparkles + bounce), and
  - a friendly streak rank ticks up in the HUD (🐣 → 🐤 → 🐸 → 🐉).
- A miss makes the frog look **sad** for ~1 second, then it returns to idle.
- The catch triggers a large particle burst with a widening ring.

## Visuals & audio

- Pastel gradient sky, soft sun and drifting clouds. The bottom is a pond: an
  animated water surface with sun glints, floating lily pads, and cattails.
  The frog sits on a large lily pad.
- Frog drawn with the 🐸 emoji; bugs with species emoji (🪰 fly, 🐞 ladybug,
  🐝 bee) that flip to face their direction of travel. Tongue is a pink
  tapered shape whose tip wobbles while it moves.
- All audio generated in code (Web Audio API): per-species catch jingles, a
  soft miss boop. Audio unlocks on the first user gesture (browser autoplay
  requirement).

## Controls & input

- `Space`, canvas click, and touch all trigger the tongue.
- Prevent space from scrolling the page.

## Technical

- Vite + TypeScript, single `<canvas>`, no game engine.
- Responsive: canvas scales to fit the window while keeping a 4:3 logical
  playfield; input coordinates are mapped from screen to logical space.

## Acceptance checks

1. Pressing space fires the tongue straight up at constant speed; it retracts
   after reaching full reach, its tip wobbling while extended.
2. When the extending tongue tip overlaps a bug, the bug is eaten (removed), a
   large particle burst + ring plays, a species-specific jingle plays, and the
   frog is happy ~2s.
3. Tongue misses cause no bug removal, a sad frog ~1s, and no jingle.
4. Bugs of three species (fly, ladybug, bee) continuously spawn from either
   edge at varied heights/speeds and exit the opposite edge, facing the way
   they fly.
5. The frog returns to idle after happy/sad states; while idle it blinks,
   gives the occasional hop pulse, and licks its lips.
6. A friendly, number-free HUD in the top-left shows the current streak as an
   emoji rank (🐣 → 🐤 → 🐸 → 🐉) with dots, plus the best rank under a 🏆.
   Streak resets on a miss; best is retained.
7. No score, no game over, no win/lose text anywhere.
8. `npm run typecheck`, `npm run test`, and `npm run build` all pass.
