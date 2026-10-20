import { describe, expect, it } from "vitest";
import { requireRole } from "../src/middleware/auth.js";

describe("role authorization", () => {
  it("rejects a student attempting an admin-only action", () => {
    let receivedError;
    requireRole("admin")({ user: { role: "student" } }, {}, (error) => {
      receivedError = error;
    });

    expect(receivedError).toMatchObject({ status: 403, message: "Insufficient permissions" });
  });

  it("allows an administrator to perform an admin-only action", () => {
    let advanced = false;
    requireRole("admin")({ user: { role: "admin" } }, {}, (error) => {
      expect(error).toBeUndefined();
      advanced = true;
    });

    expect(advanced).toBe(true);
  });
});
