# Tongue Catch — Spec

A one-button web game where a frog at the bottom of the screen catches flies
with its tongue. No score, no lives, no fail state — built to delight, not to
compete.

## Rules

- Press **space** (or click/tap the canvas) to make the frog's tongue lunge
  straight up from its mouth at a **constant speed**.
- The tongue extends to its full reach, then retracts. A fly caught while the
  tongue is extending is eaten.
- Flies spawn from the left/right edges at random heights, fly across at
  random speeds/directions with a slight wobble, and despawn off the far edge.
  Spawning never stops.
- No score. No game over. Misses have no consequence beyond a brief sad face.

## Feel targets

- Tongue speed is constant and identical in both directions (snappy, readable).
- Catch window is generous: the tongue tip can touch a fly anywhere along its
  reach column.
- Every catch rewards the player:
  - a **procedural jingle** (Web Audio, randomized so it sounds different each
    time), and
  - the frog looks **happy** for ~2 seconds (sparkles + big smile).
- A miss makes the frog look **sad** for ~1 second, then it returns to idle.
- The fly catch triggers a small particle burst.

## Visuals & audio

- Pastel gradient sky, soft sun and clouds, lily pads along the bottom.
- Frog drawn with the 🐸 emoji; flies with 🪰. Tongue is a pink tapered shape.
- All audio generated in code (Web Audio API): catch jingles, a soft miss boop.
  Audio unlocks on the first user gesture (browser autoplay requirement).

## Controls & input

- `Space`, canvas click, and touch all trigger the tongue.
- Prevent space from scrolling the page.

## Technical

- Vite + TypeScript, single `<canvas>`, no game engine.
- Responsive: canvas scales to fit the window while keeping a 4:3 logical
  playfield; input coordinates are mapped from screen to logical space.

## Acceptance checks

1. Pressing space fires the tongue straight up at constant speed; it retracts
   after reaching full reach.
2. When the extending tongue tip overlaps a fly, the fly is eaten (removed), a
   particle burst plays, a jingle plays, and the frog is happy ~2s.
3. Tongue misses cause no fly removal, a sad frog ~1s, and no jingle.
4. Flies continuously spawn from either edge at varied heights/speeds and exit
   the opposite edge.
5. The frog returns to idle after happy/sad states.
6. No score, no game over, no win/lose text anywhere.
7. `npm run typecheck`, `npm run test`, and `npm run build` all pass.
