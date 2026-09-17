import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@repo/database";
import { publicShareRoutes, shareRoutes } from "./shares.js";

vi.mock("@repo/database", () => ({
  prisma: {
    identityShare: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    identity: {
      findUnique: vi.fn(),
    },
  },
}));

const OWNER_ID = "user-owner";
const OTHER_ID = "user-other";

async function buildApp() {
  const app = Fastify();
  await app.register(publicShareRoutes);
  return app;
}

// Mirrors the shape of the real `authenticate` preHandler (apps/api/src/plugins/authenticate.ts)
// without hitting the database: the caller identifies themselves via a test-only hook, and every
// ownership check under test runs exactly as it does against a real session.
async function buildOwnerApp(callerId: string) {
  const app = Fastify();
  app.decorateRequest("userId", "");
  app.addHook("preHandler", async (request: FastifyRequest) => {
    request.userId = callerId;
  });
  await app.register(shareRoutes);
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

describe("owner-facing share lifecycle ownership checks", () => {
  beforeEach(() => {
    vi.mocked(prisma.identity.findUnique).mockReset();
    vi.mocked(prisma.identityShare.findUnique).mockReset();
    vi.mocked(prisma.identityShare.findMany).mockReset();
    vi.mocked(prisma.identityShare.create).mockReset();
    vi.mocked(prisma.identityShare.update).mockReset();
  });

  describe("POST /identities/:id/shares", () => {
    it("returns 403 rather than creating a share for another user's identity", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        id: "identity-1",
        userId: OWNER_ID,
      } as never);
      const app = await buildOwnerApp(OTHER_ID);

      const res = await app.inject({
        method: "POST",
        url: "/identities/identity-1/shares",
        payload: {},
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityShare.create).not.toHaveBeenCalled();
    });

    it("creates a share for its owner", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        id: "identity-1",
        userId: OWNER_ID,
      } as never);
      vi.mocked(prisma.identityShare.create).mockResolvedValue({
        token: "tok",
      } as never);
      const app = await buildOwnerApp(OWNER_ID);

      const res = await app.inject({
        method: "POST",
        url: "/identities/identity-1/shares",
        payload: {},
      });

      expect(res.statusCode).toBe(201);
    });
  });

  describe("GET /identities/:id/shares", () => {
    it("returns 403 rather than another user's share list", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        id: "identity-1",
        userId: OWNER_ID,
      } as never);
      const app = await buildOwnerApp(OTHER_ID);

      const res = await app.inject({
        method: "GET",
        url: "/identities/identity-1/shares",
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityShare.findMany).not.toHaveBeenCalled();
    });
  });

  describe("GET /users/:id/shares", () => {
    it("returns 403 rather than another user's cross-identity share list", async () => {
      const app = await buildOwnerApp(OTHER_ID);

      const res = await app.inject({
        method: "GET",
        url: `/users/${OWNER_ID}/shares`,
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityShare.findMany).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /shares/:token (revoke)", () => {
    it("returns 403 rather than revoking a share owned by another user", async () => {
      vi.mocked(prisma.identityShare.findUnique).mockResolvedValue({
        token: "tok",
        identity: { userId: OWNER_ID },
      } as never);
      const app = await buildOwnerApp(OTHER_ID);

      const res = await app.inject({ method: "DELETE", url: "/shares/tok" });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityShare.update).not.toHaveBeenCalled();
    });

    it("revokes a share for its owner", async () => {
      vi.mocked(prisma.identityShare.findUnique).mockResolvedValue({
        token: "tok",
        identity: { userId: OWNER_ID },
      } as never);
      const app = await buildOwnerApp(OWNER_ID);

      const res = await app.inject({ method: "DELETE", url: "/shares/tok" });

      expect(res.statusCode).toBe(204);
      expect(prisma.identityShare.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: "tok" },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
