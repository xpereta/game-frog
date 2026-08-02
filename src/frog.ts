import {
  EAT_POP_DURATION,
  EAT_POP_HEIGHT,
  EAT_POP_WIDTH,
  FATNESS_CAP,
  FATNESS_HEIGHT_MAX,
  FATNESS_WIDTH_MAX,
  FROG_X,
  FROG_Y,
} from "./consts";
import { mouthY, tongueTipY, type Tongue } from "./tongue";

export type FrogState = "idle" | "happy" | "sad";

export interface FrogDrawState {
  frogState: FrogState;
  stateTimer: number;
  elapsed: number;
  catchCount?: number;
  variant?: number;
  /** 0 → 1, how fat the frog is (drives the width/height scales). */
  fatness?: number;
  /** `elapsed` timestamp of the last swallow; used to time the eat-pop squash. */
  eatPopAt?: number;
}

const HAPPY_MS = 2000;
const MULTI_SPIN_END = 0.6;
const BLINK_DURATION = 0.12;
const HOP_DURATION = 0.45;
const LICK_DURATION = 0.3;

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

/** Fatness (0 → 1) from the current streak; reaches 1 at `FATNESS_CAP`. */
export function frogFatness(streak: number): number {
  return Math.min(1, Math.max(0, streak / FATNESS_CAP));
}

/** Horizontal scale of the frog glyph for a given fatness (1 → FATNESS_WIDTH_MAX). */
export function frogWidthScale(fatness: number): number {
  return 1 + (FATNESS_WIDTH_MAX - 1) * Math.min(1, Math.max(0, fatness));
}

/** Vertical scale of the frog glyph for a given fatness (1 → FATNESS_HEIGHT_MAX). */
export function frogHeightScale(fatness: number): number {
  return 1 + (FATNESS_HEIGHT_MAX - 1) * Math.min(1, Math.max(0, fatness));
}

/**
 * Eat-pop squash-stretch: widens and flattens at the swallow, returns to
 * identity by the end of the window. `elapsedSinceEat` is seconds since the
 * swallow landed; returns `{ x: 1, y: 1 }` outside the window.
 */
export function eatPopScale(elapsedSinceEat: number, duration = EAT_POP_DURATION): { x: number; y: number } {
  if (elapsedSinceEat < 0 || elapsedSinceEat > duration) return { x: 1, y: 1 };
  const t = elapsedSinceEat / duration;
  const pulse = Math.sin(t * Math.PI);
  return { x: 1 + EAT_POP_WIDTH * pulse, y: 1 - EAT_POP_HEIGHT * pulse };
}

/**
 * Excited jump for the happy state. `elapsedFraction` is the progress through
 * the happy window (0 → 1); returns a negative (upward) dy. Single catches get
 * one springy leap that overshoots and settles. Multi-catches (2+ bugs) jump
 * higher and hover at the peak until the spin completes, then settle back down
 * without ever dipping below rest.
 */
export function happyJumpOffset(elapsedFraction: number, multicatch = false): number {
  const p = Math.min(1, Math.max(0, elapsedFraction));
  if (p <= 0 || p >= 1) return 0;
  if (multicatch) {
    const PEAK = 95;
    const HOLD_AT = 0.35;
    let lift: number;
    if (p <= HOLD_AT) {
      lift = Math.sin((p / HOLD_AT) * (Math.PI / 2)) * PEAK;
    } else if (p <= MULTI_SPIN_END) {
      lift = PEAK;
    } else {
      const t = (p - MULTI_SPIN_END) / (1 - MULTI_SPIN_END);
      lift = PEAK * (1 - Math.sin(t * (Math.PI / 2)));
    }
    return -lift;
  }
  return -Math.sin(p * Math.PI * 3) * 40 * Math.exp(-p * 3);
}

/**
 * Rotation for the happy frog: a small side-to-side lean for a single catch,
 * or a complete 360° spin for a multi-catch. `elapsedFraction` is progress
 * through the happy window (0 → 1). `variant` (0 → 1) randomizes the lean
 * direction, phase, and amplitude so each catch looks a little different.
 */
export function happyRotation(elapsedFraction: number, multicatch = false, variant = 0): number {
  const p = Math.min(1, Math.max(0, elapsedFraction));
  if (p <= 0) return 0;
  if (multicatch) return Math.min(p / MULTI_SPIN_END, 1) * Math.PI * 2;
  if (p >= 1) return 0;
  const v = variant % 1;
  const amp = 0.12 + v * 0.06;
  const phase = v * Math.PI * 2;
  return Math.sin(p * Math.PI * 5 + phase) * amp * Math.exp(-p * 2.5);
}

function startLick(elapsed: number) {
  lickStartedAt = elapsed;
  nextLickAt = elapsed + rnd(4, 7);
}

export function drawFrog(ctx: CanvasRenderingContext2D, state: FrogDrawState) {
  const { frogState, stateTimer, elapsed, catchCount = 1, variant = 0, fatness = 0, eatPopAt = -1 } = state;
  const multicatch = catchCount > 1;
  const fatScaleX = frogWidthScale(fatness);
  const fatScaleY = frogHeightScale(fatness);

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
    ctx.scale(fatScaleX, fatScaleY);
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

  scaleX *= fatScaleX;
  scaleY *= fatScaleY;
  if (eatPopAt >= 0) {
    const { x: popX, y: popY } = eatPopScale(elapsed - eatPopAt);
    scaleX *= popX;
    scaleY *= popY;
  }

  const happyProgress = frogState === "happy" ? Math.min(1, 1 - stateTimer / HAPPY_MS) : 0;

  ctx.translate(FROG_X, y + (frogState === "happy" ? happyJumpOffset(happyProgress, multicatch) : 0));
  if (frogState === "happy") ctx.rotate(happyRotation(happyProgress, multicatch, variant));
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
  const segments = 14;
  const creep = tongue.state === "extend" ? 1 : 0.45;
  const amp = (3 + tongue.len * 0.012) * creep;

  const strokeTongue = (color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const s = i / segments;
      const y = from + (to - from) * s;
      const x = FROG_X + (Math.sin(s * 9 + elapsed * 4) - Math.sin(elapsed * 4)) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  strokeTongue("#ff8fb0", 12);
  strokeTongue("#ff5b94", 7);
}
