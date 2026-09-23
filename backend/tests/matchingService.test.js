import { describe, expect, it } from "vitest";
import { combineMatchScores } from "../src/services/matchingService.js";

describe("hybrid match scoring", () => {
  it("uses the documented 60/40 rule-based and semantic weighting", () => {
    expect(combineMatchScores(80, 50)).toBe(68);
  });

  it("keeps final scores in the visible 0 to 100 range", () => {
    expect(combineMatchScores(-20, -20)).toBe(0);
    expect(combineMatchScores(200, 200)).toBe(100);
  });
});
