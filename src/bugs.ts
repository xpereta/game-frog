import { H, W } from "./consts";

export type BugSpecies = "fly" | "ladybug" | "bee";

export interface BugSpeciesConfig {
  emoji: string;
  minSpeed: number;
  maxSpeed: number;
  fontSize: number;
}

export const BUG_SPECIES: Record<BugSpecies, BugSpeciesConfig> = {
  fly: { emoji: "🪰", minSpeed: 70, maxSpeed: 190, fontSize: 52 },
  ladybug: { emoji: "🐞", minSpeed: 45, maxSpeed: 110, fontSize: 44 },
  bee: { emoji: "🐝", minSpeed: 110, maxSpeed: 240, fontSize: 60 },
};

const SPECIES: BugSpecies[] = ["fly", "ladybug", "bee"];

const EDGE_LEFT = -40;
const EDGE_RIGHT = W + 40;
const MIN_Y = 70;
const MAX_Y = H - 170;
const BUG_R = 22;
const WOB_BASE = 6;
const WOB_RANGE = 16;

export interface Bug {
  species: BugSpecies;
  x: number;
  baseY: number;
  vx: number;
  phase: number;
  wobbleAmp: number;
}

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

export function randomSpecies(): BugSpecies {
  return SPECIES[Math.floor(Math.random() * SPECIES.length)];
}

export function spawnBug(species?: BugSpecies): Bug {
  const kind = species ?? randomSpecies();
  const cfg = BUG_SPECIES[kind];
  const fromLeft = Math.random() < 0.5;
  return {
    species: kind,
    x: fromLeft ? EDGE_LEFT : EDGE_RIGHT,
    baseY: rnd(MIN_Y, MAX_Y),
    vx: fromLeft ? rnd(cfg.minSpeed, cfg.maxSpeed) : -rnd(cfg.minSpeed, cfg.maxSpeed),
    phase: rnd(0, Math.PI * 2),
    wobbleAmp: rnd(WOB_BASE, WOB_BASE + WOB_RANGE),
  };
}

export function spawnFly(): Bug {
  return spawnBug("fly");
}

export function updateBug(b: Bug, dt: number) {
  b.x += b.vx * dt;
  b.phase += dt * 3;
}

export function bugY(b: Bug): number {
  return b.baseY + Math.sin(b.phase) * b.wobbleAmp;
}

export function isOffScreen(b: Bug): boolean {
  return b.x < EDGE_LEFT - 20 || b.x > EDGE_RIGHT + 20;
}

export function bugBounds(b: Bug) {
  return {
    cx: b.x,
    cy: bugY(b),
    r: BUG_R,
  };
}

export function facingSign(b: Bug): number {
  return Math.sign(b.vx);
}
