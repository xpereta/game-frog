import { FLY_R, H, W } from "./consts";

export interface Fly {
  x: number;
  baseY: number;
  vx: number;
  phase: number;
  wobbleAmp: number;
}

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

export function spawnFly(): Fly {
  const fromLeft = Math.random() < 0.5;
  return {
    x: fromLeft ? -40 : W + 40,
    baseY: rnd(70, H - 170),
    vx: fromLeft ? rnd(70, 190) : -rnd(70, 190),
    phase: rnd(0, Math.PI * 2),
    wobbleAmp: rnd(6, 22),
  };
}

export function updateFly(f: Fly, dt: number) {
  f.x += f.vx * dt;
  f.phase += dt * 3;
}

export function flyY(f: Fly): number {
  return f.baseY + Math.sin(f.phase) * f.wobbleAmp;
}

export function isOffScreen(f: Fly): boolean {
  return f.x < -60 || f.x > W + 60;
}

export function flyBounds(f: Fly) {
  return {
    cx: f.x,
    cy: flyY(f),
    r: FLY_R,
  };
}
