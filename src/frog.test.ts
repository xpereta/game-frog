import { describe, expect, it } from "vitest";
import {
  blinkScale,
  happyBounceOffset,
  hopPulseScale,
  tongueTipWobble,
} from "./frog";

describe("tongueTipWobble", () => {
  it("oscillates within amplitude and crosses zero at phase 0", () => {
    expect(tongueTipWobble(0)).toBe(0);
    expect(tongueTipWobble(Math.PI / 2)).toBeCloseTo(5, 5);
    expect(tongueTipWobble(Math.PI)).toBeCloseTo(0, 5);
    for (let i = 0; i < 100; i++) {
      expect(Math.abs(tongueTipWobble(i * 0.7))).toBeLessThanOrEqual(5);
    }
  });

  it("respects a custom amplitude", () => {
    expect(tongueTipWobble(Math.PI / 2, 3)).toBeCloseTo(3, 5);
  });
});

describe("blinkScale", () => {
  it("is 1 outside the blink window", () => {
    expect(blinkScale(-1)).toBe(1);
    expect(blinkScale(0.5)).toBe(1);
  });

  it("dips to 0.95 at the midpoint and returns to 1 at the edges", () => {
    expect(blinkScale(0)).toBe(1);
    expect(blinkScale(0.06)).toBeCloseTo(0.95, 5);
    expect(blinkScale(0.12)).toBeCloseTo(1, 5);
  });
});

describe("hopPulseScale", () => {
  it("returns 1 outside the pulse window", () => {
    expect(hopPulseScale(-1)).toBe(1);
    expect(hopPulseScale(1)).toBe(1);
  });

  it("peaks at 1.04 mid-pulse and settles at the edges", () => {
    expect(hopPulseScale(0)).toBe(1);
    expect(hopPulseScale(0.45 / 2)).toBeCloseTo(1.04, 5);
    expect(hopPulseScale(0.45)).toBeCloseTo(1, 5);
  });
});

describe("happyBounceOffset", () => {
  it("starts and ends at rest with a springy upward swing of a few px", () => {
    expect(happyBounceOffset(0)).toBe(0);
    expect(happyBounceOffset(1)).toBeCloseTo(0, 5);
    let min = 0;
    let max = 0;
    for (let i = 0; i < 100; i++) {
      const dy = happyBounceOffset(i / 100);
      min = Math.min(min, dy);
      max = Math.max(max, dy);
    }
    expect(min).toBeGreaterThan(-5);
    expect(min).toBeLessThan(-2);
    expect(max).toBeLessThan(1);
  });

  it("clamps out-of-range progress", () => {
    expect(happyBounceOffset(-1)).toBe(0);
    expect(happyBounceOffset(2)).toBeCloseTo(0, 5);
  });
});
