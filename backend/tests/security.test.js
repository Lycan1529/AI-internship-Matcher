import { describe, expect, it } from "vitest";
import { authRateLimit, securityHeaders } from "../src/middleware/security.js";

describe("production security middleware", () => {
  it("sets baseline browser security headers", () => {
    const headers = new Map();
    let advanced = false;
    securityHeaders({}, { setHeader: (key, value) => headers.set(key, value) }, () => {
      advanced = true;
    });

    expect(advanced).toBe(true);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("limits repeated authentication attempts from one address", () => {
    const request = { ip: `test-${Date.now()}-${Math.random()}`, socket: {} };
    let receivedError;
    const next = (error) => {
      receivedError = error;
    };

    for (let index = 0; index < 20; index += 1) {
      authRateLimit(request, {}, next);
      expect(receivedError).toBeUndefined();
    }
    authRateLimit(request, {}, next);
    expect(receivedError).toMatchObject({ status: 429, code: "AUTH_RATE_LIMITED" });
  });
});
