import { describe, expect, it } from "vitest";
import { bestStreakAfter, rankForStreak } from "./hud";

describe("rankForStreak", () => {
  it("maps low streaks to the chick emoji", () => {
    expect(rankForStreak(0)).toBe("🐣");
    expect(rankForStreak(2)).toBe("🐣");
  });

  it("maps mid streaks to the duckling emoji", () => {
    expect(rankForStreak(3)).toBe("🐤");
    expect(rankForStreak(5)).toBe("🐤");
  });

  it("maps higher streaks to the frog emoji", () => {
    expect(rankForStreak(6)).toBe("🐸");
    expect(rankForStreak(9)).toBe("🐸");
  });

  it("maps big streaks to the dragon emoji", () => {
    expect(rankForStreak(10)).toBe("🐉");
    expect(rankForStreak(15)).toBe("🐉");
  });
});

describe("bestStreakAfter", () => {
  it("never decreases the best streak", () => {
    expect(bestStreakAfter(2, 0)).toBe(2);
    expect(bestStreakAfter(1, 5)).toBe(5);
    expect(bestStreakAfter(5, 5)).toBe(5);
    expect(bestStreakAfter(9, 5)).toBe(9);
  });
});
