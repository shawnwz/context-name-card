import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@repo/database";
import { publicShareRoutes } from "./shares.js";

vi.mock("@repo/database", () => ({
  prisma: {
    identityShare: { findUnique: vi.fn() },
  },
}));

async function buildApp() {
  const app = Fastify();
  await app.register(publicShareRoutes);
  return app;
}

describe("GET /shares/:token", () => {
  beforeEach(() => {
    vi.mocked(prisma.identityShare.findUnique).mockReset();
  });

  it("returns 404 when the share does not exist", async () => {
    vi.mocked(prisma.identityShare.findUnique).mockResolvedValue(null);
    const app = await buildApp();

    const res = await app.inject({ method: "GET", url: "/shares/missing" });

    expect(res.statusCode).toBe(404);
  });

  it("returns 410 when the share was revoked", async () => {
    vi.mocked(prisma.identityShare.findUnique).mockResolvedValue({
      revokedAt: new Date(),
      expiresAt: null,
      template: "cover",
      identity: {},
    } as never);
    const app = await buildApp();

    const res = await app.inject({ method: "GET", url: "/shares/revoked-token" });

    expect(res.statusCode).toBe(410);
  });

  it("returns 410 when the share has expired", async () => {
    vi.mocked(prisma.identityShare.findUnique).mockResolvedValue({
      revokedAt: null,
      expiresAt: new Date("2000-01-01"),
      template: "cover",
      identity: {},
    } as never);
    const app = await buildApp();

    const res = await app.inject({ method: "GET", url: "/shares/expired-token" });

    expect(res.statusCode).toBe(410);
  });

  it("returns the identity with its template when the share is valid", async () => {
    vi.mocked(prisma.identityShare.findUnique).mockResolvedValue({
      revokedAt: null,
      expiresAt: null,
      template: "geometric",
      identity: { id: "identity-1", displayName: "Ada" },
    } as never);
    const app = await buildApp();

    const res = await app.inject({ method: "GET", url: "/shares/good-token" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: "identity-1", displayName: "Ada", template: "geometric" });
  });
});
