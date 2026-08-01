import { FROG_X, FROG_Y } from "./consts";
import { mouthY, tongueTipY, type Tongue } from "./tongue";

export type FrogState = "idle" | "happy" | "sad";

export interface FrogDrawState {
  frogState: FrogState;
  stateTimer: number;
  elapsed: number;
}

const HAPPY_MS = 2000;
const BLINK_DURATION = 0.12;
const HOP_DURATION = 0.45;
const LICK_DURATION = 0.3;
const WIGGLE_SPEED = 12;
const WIGGLE_AMP = 4;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

let lastState: FrogState = "idle";
let nextBlinkAt = rnd(2.5, 5);
let nextHopAt = rnd(3, 6);
let nextLickAt = rnd(4, 7);
let blinkStartedAt = -1;
let hopStartedAt = -1;
let lickStartedAt = -1;

/** Horizontal offset of the tongue tip from its resting column, in px. */
export function tongueTipWobble(phase: number, amp = 5): number {
  return Math.sin(phase) * amp;
}

/** Height scale applied during a blink (1 = full size, dips to 0.95). */
export function blinkScale(elapsedSinceBlink: number, duration = BLINK_DURATION): number {
  if (elapsedSinceBlink < 0 || elapsedSinceBlink > duration) return 1;
  const t = elapsedSinceBlink / duration;
  return 1 - 0.05 * Math.sin(t * Math.PI);
}

/** Squash-stretch scale for the idle hop pulse (peaks at 1.04). */
export function hopPulseScale(elapsedSinceHop: number, duration = HOP_DURATION): number {
  if (elapsedSinceHop < 0 || elapsedSinceHop > duration) return 1;
  const t = elapsedSinceHop / duration;
  return 1 + 0.04 * Math.sin(t * Math.PI);
}

/**
 * Excited jump for the happy state. `elapsedFraction` is the progress through
 * the happy window (0 → 1); returns a negative (upward) dy. One big springy
 * leap that overshoots and settles.
 */
export function happyJumpOffset(elapsedFraction: number): number {
  const p = Math.min(1, Math.max(0, elapsedFraction));
  if (p <= 0 || p >= 1) return 0;
  return -Math.sin(p * Math.PI * 3) * 30 * Math.exp(-p * 3);
}

function startLick(elapsed: number) {
  lickStartedAt = elapsed;
  nextLickAt = elapsed + rnd(4, 7);
}

export function drawFrog(ctx: CanvasRenderingContext2D, state: FrogDrawState) {
  const { frogState, stateTimer, elapsed } = state;

  if (lastState === "happy" && frogState === "idle") startLick(elapsed);
  lastState = frogState;

  if (frogState !== "idle") {
    blinkStartedAt = -1;
    hopStartedAt = -1;
    lickStartedAt = -1;
  } else {
    if (blinkStartedAt < 0 && elapsed >= nextBlinkAt) {
      blinkStartedAt = elapsed;
      nextBlinkAt = elapsed + rnd(2.5, 5);
    }
    if (hopStartedAt < 0 && elapsed >= nextHopAt) {
      hopStartedAt = elapsed;
      nextHopAt = elapsed + rnd(3, 6);
    }
    if (lickStartedAt < 0 && elapsed >= nextLickAt) startLick(elapsed);
  }

  const bob = Math.sin(elapsed * 2.4) * 3;
  const y = FROG_Y + bob;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (frogState === "sad") {
    ctx.translate(FROG_X, y);
    ctx.rotate(0.08);
    ctx.font = "88px serif";
    ctx.fillText("🐸", 0, 0);
    ctx.font = "26px serif";
    ctx.fillText("💧", 34, -18);
    ctx.restore();
    return;
  }

  let scaleX = 1;
  let scaleY = 1;

  if (blinkStartedAt >= 0) {
    const since = elapsed - blinkStartedAt;
    if (since < BLINK_DURATION) scaleY *= blinkScale(since);
    else blinkStartedAt = -1;
  }

  if (hopStartedAt >= 0) {
    const since = elapsed - hopStartedAt;
    if (since < HOP_DURATION) {
      const s = hopPulseScale(since);
      scaleX *= s;
      scaleY *= s;
    } else hopStartedAt = -1;
  }

  const happyProgress = frogState === "happy" ? Math.min(1, 1 - stateTimer / HAPPY_MS) : 0;

  ctx.translate(FROG_X, y + (frogState === "happy" ? happyJumpOffset(happyProgress) : 0));
  ctx.scale(scaleX, scaleY);
  ctx.font = "88px serif";
  ctx.fillText("🐸", 0, 0);

  if (frogState === "happy") {
    const spread = 46 + happyProgress * 40;
    ctx.font = "24px serif";
    ctx.fillText("✨", spread, -30);
    ctx.fillText("😄", 22, -60);
  }

  if (lickStartedAt >= 0) {
    const since = elapsed - lickStartedAt;
    if (since < LICK_DURATION) {
      ctx.font = "28px serif";
      ctx.fillText("😝", 44, -20);
    } else lickStartedAt = -1;
  }

  ctx.restore();
}

export function drawTongue(ctx: CanvasRenderingContext2D, tongue: Tongue, elapsed: number) {
  if (tongue.state === "idle") return;
  const from = mouthY();
  const to = tongueTipY(tongue);
  const midY = (from + to) / 2;
  const wobble = tongueTipWobble(elapsed * WIGGLE_SPEED, WIGGLE_AMP);

  ctx.strokeStyle = "#ff8fb0";
  ctx.lineCap = "round";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(FROG_X, from);
  ctx.quadraticCurveTo(FROG_X + wobble * 0.3, midY, FROG_X + wobble, to);
  ctx.stroke();

  ctx.strokeStyle = "#ff5b94";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(FROG_X, from);
  ctx.quadraticCurveTo(FROG_X + wobble * 0.3, midY, FROG_X + wobble, to);
  ctx.stroke();
}
