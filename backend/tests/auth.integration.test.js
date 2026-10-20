import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("../src/db.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "../src/db.js";
import { authRouter } from "../src/routes/auth.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { requireAuth } from "../src/middleware/auth.js";

process.env.JWT_SECRET = "test-secret";

describe("authentication API", () => {
  let passwordHash;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash("password123", 4);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function routeHandler(path, method) {
    const layer = authRouter.stack.find(
      (item) => item.route?.path === path && item.route.methods[method],
    );
    return layer?.route.stack.at(-1)?.handle;
  }

  function invoke(handler, req = {}) {
    return new Promise((resolve) => {
      const response = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          resolve({ status: this.statusCode, body });
        },
      };
      handler({ body: {}, headers: {}, ...req }, response, (error) => resolve({ error }));
    });
  }

  function formatError(error) {
    let output;
    const response = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        output = { status: this.statusCode, body };
      },
    };
    errorHandler(error, {}, response, () => {});
    return output;
  }

  it("registers a new account and returns a bearer token", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "user-1", email: "student@fhnw.ch", role: "student" });

    const response = await invoke(routeHandler("/register", "post"), {
      body: { email: "student@fhnw.ch", password: "password123", role: "student" },
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({ id: "user-1", email: "student@fhnw.ch", role: "student" });
    expect(response.body.token).toEqual(expect.any(String));
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });

  it("rejects invalid credentials with the standard error response", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "student@fhnw.ch",
      role: "student",
      passwordHash,
    });

    const result = await invoke(routeHandler("/login", "post"), {
      body: { email: "student@fhnw.ch", password: "wrong-password" },
    });
    const response = formatError(result.error);

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      code: "AUTH_UNAUTHENTICATED",
      message: "Invalid email or password",
    });
  });

  it("does not allow public registration of an administrator", async () => {
    const result = await invoke(routeHandler("/register", "post"), {
      body: { email: "admin@fhnw.ch", password: "password123", role: "admin" },
    });
    const response = formatError(result.error);

    expect(response.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("blocks login for a suspended account", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "student@fhnw.ch",
      role: "student",
      passwordHash,
      status: "suspended",
    });

    const result = await invoke(routeHandler("/login", "post"), {
      body: { email: "student@fhnw.ch", password: "password123" },
    });
    const response = formatError(result.error);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });

  it("requires a bearer token for protected requests", async () => {
    const result = await invoke(requireAuth);
    const response = formatError(result.error);

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      code: "AUTH_UNAUTHENTICATED",
      message: "Missing bearer token",
    });
  });
});
