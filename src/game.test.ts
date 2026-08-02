import { describe, expect, it } from "vitest";
import { H, TONGUE_REACH, TONGUE_SPEED, W } from "./consts";
import { bugY, isOffScreen, spawnFly, updateBug } from "./bugs";
import {
  altitudeFor,
  createTongue,
  fireTongue,
  mouthY,
  tongueHitsBug,
  tongueTipY,
  updateTongue,
} from "./tongue";

describe("spawnFly", () => {
  it("spawns at an edge within the playfield height band", () => {
    for (let i = 0; i < 200; i++) {
      const f = spawnFly();
      expect(f.x === -40 || f.x === W + 40).toBe(true);
      expect(f.baseY).toBeGreaterThanOrEqual(70);
      expect(f.baseY).toBeLessThanOrEqual(H - 170);
      expect(Math.abs(f.vx)).toBeGreaterThanOrEqual(70);
      expect(Math.abs(f.vx)).toBeLessThanOrEqual(190);
    }
  });

  it("flies across and is eventually off screen", () => {
    const f = spawnFly();
    const dir = Math.sign(f.vx);
    for (let i = 0; i < 1000; i++) updateBug(f, 0.016);
    expect(isOffScreen(f)).toBe(true);
    expect(Math.sign(f.vx)).toBe(dir);
  });

  it("keeps the visible y within a bounded wobble", () => {
    const f = spawnFly();
    for (let i = 0; i < 500; i++) {
      updateBug(f, 0.016);
      const y = bugY(f);
      expect(y).toBeGreaterThanOrEqual(f.baseY - 23);
      expect(y).toBeLessThanOrEqual(f.baseY + 23);
    }
  });
});

describe("tongue", () => {
  it("starts idle and fires once", () => {
    const t = createTongue();
    expect(fireTongue(t)).toBe(true);
    expect(fireTongue(t)).toBe(false);
  });

  it("extends at constant speed up to reach, then retracts to idle", () => {
    const t = createTongue();
    fireTongue(t);
    const step = 0.01;
    const stepsToReach = Math.ceil(TONGUE_REACH / (TONGUE_SPEED * step));
    for (let i = 0; i < stepsToReach; i++) {
      expect(t.state).toBe("extend");
      updateTongue(t, step);
    }
    expect(t.state).toBe("retract");
    expect(t.len).toBe(TONGUE_REACH);
    expect(tongueTipY(t)).toBeCloseTo(56, 0);
    for (let i = 0; i < 100; i++) updateTongue(t, 0.1);
    expect(t.state).toBe("idle");
    expect(t.len).toBe(0);
  });

  it("reports a miss exactly once when extension completes", () => {
    const t = createTongue();
    fireTongue(t);
    let misses = 0;
    for (let i = 0; i < 200; i++) {
      if (updateTongue(t, 0.1)) misses++;
    }
    expect(misses).toBe(1);
  });

  it("catches a bug directly above the mouth and misses far-off ones", () => {
    const t = createTongue();
    fireTongue(t);
    updateTongue(t, TONGUE_REACH / TONGUE_SPEED + 0.001);
    expect(tongueHitsBug(t, W / 2, tongueTipY(t))).toBe(true);
    expect(tongueHitsBug(t, W / 2 - 80, tongueTipY(t))).toBe(false);
  });

  it("computes altitude 0 at the mouth, ~1 at max reach, clamped out of range", () => {
    expect(altitudeFor(mouthY())).toBe(0);
    expect(altitudeFor(mouthY() - TONGUE_REACH)).toBeCloseTo(1, 5);
    expect(altitudeFor(mouthY() - TONGUE_REACH * 0.5)).toBeCloseTo(0.5, 5);
    expect(altitudeFor(mouthY() + 100)).toBe(0);
    expect(altitudeFor(mouthY() - TONGUE_REACH - 100)).toBe(1);
  });
});
