import { describe, expect, it } from "vitest";
import { canTransitionApplication } from "../src/services/applicationLifecycle.js";

describe("application lifecycle", () => {
  it("allows the approved progression from Applied to Interview", () => {
    expect(canTransitionApplication("Applied", "Interview")).toBe(true);
  });

  it("allows rejection before or after interview", () => {
    expect(canTransitionApplication("Applied", "Rejected")).toBe(true);
    expect(canTransitionApplication("Interview", "Rejected")).toBe(true);
  });

  it("allows an offer only after interview", () => {
    expect(canTransitionApplication("Interview", "Offer")).toBe(true);
    expect(canTransitionApplication("Applied", "Offer")).toBe(false);
  });

  it("prevents transitions out of a terminal status", () => {
    expect(canTransitionApplication("Offer", "Interview")).toBe(false);
    expect(canTransitionApplication("Rejected", "Applied")).toBe(false);
  });
});
