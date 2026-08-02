import { FROG_R, FROG_X, FROG_Y, TONGUE_REACH, TONGUE_SPEED, TONGUE_TIP_R } from "./consts";

export type TongueState = "idle" | "extend" | "retract";

export interface Tongue {
  state: TongueState;
  len: number;
}

export function createTongue(): Tongue {
  return { state: "idle", len: 0 };
}

export function fireTongue(t: Tongue): boolean {
  if (t.state !== "idle") return false;
  t.state = "extend";
  return true;
}

export const mouthY = () => FROG_Y - FROG_R;

/** How high (0..1) a point at y is above the frog's mouth, relative to max tongue reach. */
export function altitudeFor(y: number): number {
  const alt = (mouthY() - y) / TONGUE_REACH;
  return Math.min(1, Math.max(0, alt));
}

export function tongueTipY(t: Tongue): number {
  return mouthY() - t.len;
}

/** Returns true when the tongue finishes extending without a catch (a miss). */
export function updateTongue(t: Tongue, dt: number, carry = false): boolean {
  if (t.state === "extend") {
    t.len += TONGUE_SPEED * dt;
    if (t.len >= TONGUE_REACH) {
      t.len = TONGUE_REACH;
      t.state = "retract";
      return true;
    }
  } else if (t.state === "retract") {
    t.len -= TONGUE_SPEED * (carry ? 1 : 2) * dt;
    if (t.len <= 0) {
      t.len = 0;
      t.state = "idle";
    }
  }
  return false;
}

export function isTongueBusy(t: Tongue): boolean {
  return t.state !== "idle";
}

export function tongueHitsBug(t: Tongue, bugCx: number, bugCy: number): boolean {
  const dx = bugCx - FROG_X;
  const dy = bugCy - tongueTipY(t);
  const r = TONGUE_TIP_R + 16;
  return dx * dx + dy * dy < r * r;
}
