# Tongue Catch — Spec

A one-button web game where a frog at the bottom of the screen catches bugs
with its tongue. No score, no lives, no fail state — built to delight, not to
compete.

## Rules

- Press **space** (or click/tap the canvas) to make the frog's tongue lunge
  straight up from its mouth at a **constant speed**.
- The tongue shoots up to its full reach, then retracts. On the way up it
  grabs every bug its tip touches — one or several at a time — and brings
  them down to the frog's mouth, where each fades out as it nears the mouth
  and is swallowed.
- Bugs come in three species (fly, ladybug, bee). They spawn from the
  left/right edges at random heights, fly across at speeds and in directions
  that vary by species, wobbling slightly, and despawn off the far edge.
  Spawning never stops.
- Misses have no consequence beyond a brief sad face and resetting your streak
  of catches in a row.
- **Out of scope:** no score, no game over, no win/lose text, no lives.

## Game feel

- Tongue extends at a constant speed and snaps back quickly when empty; while
  carrying bugs it returns a bit slower so the catch is visible.
- Catch window is generous: the tongue tip can touch a bug anywhere along the
  vertical band it travels through.
- Every catch rewards the player:
  - a short **grab sound** when the tongue touches a bug, plus a
    **per-species jingle** with a low thump when it's swallowed (Web Audio,
    randomized so it sounds different each time),
  - the frog looks **happy** for ~2 seconds (jump + splash + a wink and smile
    from the sun),
  - and a streak of catches in a row builds a friendly emoji rank in a
    top-of-screen HUD: 🐣 → 🐤 → 🐸 → 🐉.
- Multi-catch (2+ bugs in one throw): the happy reaction is upgraded — a higher
  jump with a full spin.
- The frog grows fatter with your streak of catches in a row, up to a comical
  maximum, and a miss makes it deflate smoothly back to normal (animated, not
  an instant snap). Each swallow plays a quick squash-and-stretch "eat" pop.
  Purely visual — it never affects gameplay.
- High catches add more: grabbing a bug above half reach plays a bright
  sparkle ping; grabbing one near the top fires gold star particles and a
  sun flare.
- A miss makes the frog look **sad** for ~1 second, then it returns to idle.
- The swallow triggers a particle burst with a widening ring at the frog.

## Visuals & audio

- Pastel gradient sky, soft sun and drifting clouds. The bottom is a pond: an
  animated water surface with sun glints, floating lily pads, and cattails.
  The frog sits on a large lily pad.
- Frog drawn with the 🐸 emoji; bugs with species emoji (🪰 fly, 🐞 ladybug,
  🐝 bee) that flip to face their direction of travel. Tongue is a pink
  tapered shape whose tip wobbles while it moves.
- All audio generated in code (Web Audio API): per-species grab sounds and
  catch jingles, a thumping swallow boom, a soft miss boop. Audio unlocks on
  the first user gesture (browser autoplay requirement).

## Controls & input

- `Space`, or tapping anywhere on the screen (the whole page is the button,
  including the letterbox around the canvas), triggers the tongue.
- Prevent space from scrolling the page.

## Technical

- Vite + TypeScript, single `<canvas>`, no game engine.
- Responsive: canvas scales to fit the window while keeping a 4:3 logical
  playfield; input coordinates are mapped from screen to logical space.

## Acceptance checks

1. Pressing space fires the tongue straight up at constant speed; it retracts
   after reaching full reach, its tip wobbling while extended.
2. When the extending tongue tip overlaps a bug, the bug is grabbed and carried
   down; as it nears the frog it fades, then a particle burst + ring plays at
   the frog, a per-species jingle plays, and the frog is happy ~2s.
3. Tongue misses cause no bug removal, a sad frog ~1s, and no jingle.
4. Bugs of all three species (fly, ladybug, bee) continuously spawn from either
   edge at varied heights/speeds and exit the opposite edge, facing the way
   they fly.
5. The frog returns to idle after happy/sad states; while idle it blinks,
   gives the occasional hop pulse, and licks its lips.
6. A friendly, number-free HUD in the top-left shows the current streak as an
   emoji rank (🐣 → 🐤 → 🐸 → 🐉) with dots, plus the best rank under a 🏆.
   Streak resets on a miss; best is retained.
7. No score, no game over, no win/lose text anywhere.
8. `npm run typecheck`, `npm run test`, and `npm run build` all pass.
