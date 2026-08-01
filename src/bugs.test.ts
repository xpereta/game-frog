import { describe, expect, it } from "vitest";
import { H, W } from "./consts";
import {
  BUG_SPECIES,
  bugRenderTransform,
  facingSign,
  isOffScreen,
  spawnBug,
  spawnFly,
  updateBug,
} from "./bugs";

const SPECIES = ["fly", "ladybug", "bee"] as const;

describe("spawnBug", () => {
  it("random spawn picks one of the known species", () => {
    for (let i = 0; i < 200; i++) {
      expect(SPECIES).toContain(spawnBug().species);
    }
  });

  it("spawnFly always spawns the fly species", () => {
    expect(spawnFly().species).toBe("fly");
  });

  for (const species of SPECIES) {
    it(`spawns ${species} at an edge, in its speed range, within the height band`, () => {
      const { minSpeed, maxSpeed } = BUG_SPECIES[species];
      for (let i = 0; i < 200; i++) {
        const b = spawnBug(species);
        expect(b.species).toBe(species);
        expect(b.x === -40 || b.x === W + 40).toBe(true);
        expect(b.baseY).toBeGreaterThanOrEqual(70);
        expect(b.baseY).toBeLessThanOrEqual(H - 170);
        expect(Math.abs(b.vx)).toBeGreaterThanOrEqual(minSpeed);
        expect(Math.abs(b.vx)).toBeLessThanOrEqual(maxSpeed);
      }
    });
  }

  it("faces the direction it enters from", () => {
    for (let i = 0; i < 200; i++) {
      const b = spawnBug();
      expect(Math.sign(b.vx)).toBe(b.x === -40 ? 1 : -1);
    }
  });
});

describe("facingSign", () => {
  it("returns +1 when moving right and -1 when moving left", () => {
    const b = spawnBug("fly");
    b.vx = 120;
    expect(facingSign(b)).toBe(1);
    b.vx = -120;
    expect(facingSign(b)).toBe(-1);
  });
});

describe("bugRenderTransform", () => {
  it("rotates top-view bugs ±90° so the head leads travel", () => {
    const fly = spawnBug("fly");
    fly.vx = 120;
    expect(bugRenderTransform(fly)).toEqual({ flip: false, angle: Math.PI / 2 });
    fly.vx = -120;
    expect(bugRenderTransform(fly)).toEqual({ flip: false, angle: -Math.PI / 2 });
  });

  it("flips side-view bugs so the head leads travel (Apple bee faces left)", () => {
    const bee = spawnBug("bee");
    bee.vx = 120;
    expect(bugRenderTransform(bee)).toEqual({ flip: true, angle: 0 });
    bee.vx = -120;
    expect(bugRenderTransform(bee)).toEqual({ flip: false, angle: 0 });
  });

  it("marks fly and ladybug as top-down, bee as side", () => {
    expect(BUG_SPECIES.fly.view).toBe("top");
    expect(BUG_SPECIES.ladybug.view).toBe("top");
    expect(BUG_SPECIES.bee.view).toBe("side");
  });
});

describe("updateBug", () => {
  it("moves a bug across the screen and despawns it off-screen", () => {
    const b = spawnBug("bee");
    const dir = Math.sign(b.vx);
    for (let i = 0; i < 1000; i++) updateBug(b, 0.016);
    expect(isOffScreen(b)).toBe(true);
    expect(Math.sign(b.vx)).toBe(dir);
  });
});

describe("species variety", () => {
  it("gives each species a distinct emoji and size", () => {
    expect(new Set(SPECIES.map((s) => BUG_SPECIES[s].emoji)).size).toBe(3);
    expect(new Set(SPECIES.map((s) => BUG_SPECIES[s].fontSize)).size).toBe(3);
  });
});
