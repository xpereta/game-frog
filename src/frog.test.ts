import { describe, expect, it } from "vitest";
import {
  EAT_POP_DURATION,
  FATNESS_CAP,
  FATNESS_HEIGHT_MAX,
  FATNESS_WIDTH_MAX,
} from "./consts";
import {
  blinkScale,
  easeFatness,
  eatPopScale,
  frogFatness,
  frogHeightScale,
  frogWidthScale,
  happyJumpOffset,
  happyRotation,
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

describe("happyJumpOffset", () => {
  it("starts and ends at rest with a big upward jump and a small overshoot", () => {
    expect(happyJumpOffset(0)).toBe(0);
    expect(happyJumpOffset(1)).toBeCloseTo(0, 5);
    let min = 0;
    let max = 0;
    for (let i = 0; i < 100; i++) {
      const dy = happyJumpOffset(i / 100);
      min = Math.min(min, dy);
      max = Math.max(max, dy);
    }
    expect(min).toBeLessThan(-15);
    expect(min).toBeGreaterThan(-40);
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThan(10);
  });

  it("jumps noticeably higher for a multi-catch", () => {
    let singleMin = 0;
    let multiMin = 0;
    for (let i = 0; i < 100; i++) {
      singleMin = Math.min(singleMin, happyJumpOffset(i / 100));
      multiMin = Math.min(multiMin, happyJumpOffset(i / 100, true));
    }
    expect(multiMin).toBeLessThan(singleMin * 1.4);
    expect(multiMin).toBeLessThan(-30);
    expect(multiMin).toBeGreaterThan(-110);
  });

  it("never dips below rest for a multi-catch", () => {
    for (let i = 0; i < 100; i++) {
      expect(happyJumpOffset(i / 100, true)).toBeLessThanOrEqual(0);
    }
    expect(happyJumpOffset(0.5, true)).toBeLessThan(-15);
  });

  it("hovers at the peak until the spin completes, then settles", () => {
    expect(happyJumpOffset(0.45, true)).toBeLessThanOrEqual(-80);
    expect(happyJumpOffset(0.6, true)).toBeLessThanOrEqual(-80);
    expect(happyJumpOffset(0.9, true)).toBeGreaterThan(-40);
    expect(happyJumpOffset(1, true)).toBeCloseTo(0, 5);
  });

  it("clamps out-of-range progress", () => {
    expect(happyJumpOffset(-1)).toBe(0);
    expect(happyJumpOffset(2)).toBeCloseTo(0, 5);
    expect(happyJumpOffset(2, true)).toBeCloseTo(0, 5);
  });
});

describe("frogFatness", () => {
  it("is 0 at no catches, 1 at the cap, and clamps beyond", () => {
    expect(frogFatness(0)).toBe(0);
    expect(frogFatness(FATNESS_CAP)).toBe(1);
    expect(frogFatness(FATNESS_CAP * 2)).toBe(1);
    expect(frogFatness(-1)).toBe(0);
  });

  it("scales linearly with streak below the cap", () => {
    expect(frogFatness(FATNESS_CAP / 2)).toBeCloseTo(0.5, 5);
    expect(frogFatness(FATNESS_CAP / 4)).toBeCloseTo(0.25, 5);
  });
});

describe("frogWidthScale", () => {
  it("is 1 when slim and the max when fully fat", () => {
    expect(frogWidthScale(0)).toBe(1);
    expect(frogWidthScale(1)).toBe(FATNESS_WIDTH_MAX);
  });

  it("clamps out-of-range fatness", () => {
    expect(frogWidthScale(-1)).toBe(1);
    expect(frogWidthScale(2)).toBe(FATNESS_WIDTH_MAX);
  });
});

describe("frogHeightScale", () => {
  it("is 1 when slim and the max when fully fat", () => {
    expect(frogHeightScale(0)).toBe(1);
    expect(frogHeightScale(1)).toBe(FATNESS_HEIGHT_MAX);
  });
});

describe("easeFatness", () => {
  it("moves partway toward the target in a step", () => {
    const next = easeFatness(0, 1, 0.1);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
    expect(next).toBeCloseTo(1 - Math.exp(-4 * 0.1), 5);
  });

  it("converges on the target over time (deflate on a miss)", () => {
    let f = 1;
    for (let i = 0; i < 300; i++) f = easeFatness(f, 0, 0.02);
    expect(f).toBeCloseTo(0, 4);
  });

  it("is a no-op for dt <= 0 or when already at the target", () => {
    expect(easeFatness(0.5, 0.5, 0.1)).toBeCloseTo(0.5, 5);
    expect(easeFatness(0.5, 0.5, 0)).toBeCloseTo(0.5, 5);
    expect(easeFatness(0.5, 1, -0.1)).toBeCloseTo(0.5, 5);
  });
});

describe("eatPopScale", () => {
  it("is identity outside the pop window", () => {
    expect(eatPopScale(-0.1)).toEqual({ x: 1, y: 1 });
    expect(eatPopScale(0)).toEqual({ x: 1, y: 1 });
    expect(eatPopScale(EAT_POP_DURATION)).toEqual({ x: 1, y: 1 });
    expect(eatPopScale(EAT_POP_DURATION + 0.5)).toEqual({ x: 1, y: 1 });
  });

  it("widens and flattens at the swallow peak", () => {
    const { x, y } = eatPopScale(EAT_POP_DURATION / 2);
    expect(x).toBeGreaterThan(1);
    expect(y).toBeLessThan(1);
  });
});

describe("happyRotation", () => {
  it("rocks gently side to side for a single catch and returns upright", () => {
    expect(happyRotation(0)).toBe(0);
    expect(happyRotation(1)).toBe(0);
    let maxAbs = 0;
    for (let i = 0; i < 100; i++) {
      const r = happyRotation(i / 100);
      expect(Math.abs(r)).toBeLessThan(0.25);
      maxAbs = Math.max(maxAbs, Math.abs(r));
    }
    expect(maxAbs).toBeGreaterThan(0.02);
  });

  it("spins a complete 360° for a multi-catch", () => {
    expect(happyRotation(0, true)).toBe(0);
    expect(happyRotation(1, true)).toBeCloseTo(Math.PI * 2, 5);
    const mid = happyRotation(0.5, true);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(Math.PI * 2);
  });

  it("finishes the multi-catch spin by 60% of the window", () => {
    expect(happyRotation(0.6, true)).toBeCloseTo(Math.PI * 2, 5);
    expect(happyRotation(1, true)).toBeCloseTo(Math.PI * 2, 5);
  });

  it("leans in a different direction depending on variant", () => {
    expect(Math.sign(happyRotation(0.1))).not.toBe(Math.sign(happyRotation(0.1, false, 0.5)));
  });
});
