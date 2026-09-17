import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@repo/database";
import { identityRoutes } from "./identities.js";

vi.mock("@repo/database", () => ({
  prisma: {
    identity: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const OWNER_ID = "user-owner";
const OTHER_ID = "user-other";

// Mirrors the shape of the real `authenticate` preHandler (apps/api/src/plugins/authenticate.ts)
// without hitting the database: the caller identifies themselves via a test-only header, and every
// ownership check under test runs exactly as it does against a real session.
async function buildApp(callerId: string) {
  const app = Fastify();
  app.decorateRequest("userId", "");
  app.addHook("preHandler", async (request: FastifyRequest) => {
    request.userId = callerId;
  });
  await app.register(identityRoutes);
  return app;
}

describe("identity ownership checks", () => {
  beforeEach(() => {
    vi.mocked(prisma.identity.findUnique).mockReset();
    vi.mocked(prisma.identity.findMany).mockReset();
    vi.mocked(prisma.identity.create).mockReset();
    vi.mocked(prisma.identity.update).mockReset();
    vi.mocked(prisma.identity.delete).mockReset();
  });

  describe("GET /identities/:id", () => {
    it("returns 404 when the identity does not exist", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue(null as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({ method: "GET", url: "/identities/id-1" });

      expect(res.statusCode).toBe(404);
    });

    it("returns 403 rather than the resource when a second user requests it", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        id: "id-1",
        userId: OWNER_ID,
        displayName: "Ada Lovelace",
      } as never);
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({ method: "GET", url: "/identities/id-1" });

      expect(res.statusCode).toBe(403);
      expect(res.json()).not.toHaveProperty("displayName");
    });

    it("returns the identity to its owner", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        id: "id-1",
        userId: OWNER_ID,
        displayName: "Ada Lovelace",
      } as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({ method: "GET", url: "/identities/id-1" });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ displayName: "Ada Lovelace" });
    });
  });

  describe("PATCH /identities/:id", () => {
    it("returns 403 rather than applying the edit when a second user attempts it", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        userId: OWNER_ID,
      } as never);
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({
        method: "PATCH",
        url: "/identities/id-1",
        payload: { displayName: "Hijacked" },
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identity.update).not.toHaveBeenCalled();
    });

    it("applies the edit for its owner", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        userId: OWNER_ID,
      } as never);
      vi.mocked(prisma.identity.update).mockResolvedValue({
        id: "id-1",
        displayName: "Updated Name",
      } as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({
        method: "PATCH",
        url: "/identities/id-1",
        payload: { displayName: "Updated Name" },
      });

      expect(res.statusCode).toBe(200);
      expect(prisma.identity.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /identities/:id", () => {
    it("returns 403 rather than deleting when a second user attempts it", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        userId: OWNER_ID,
      } as never);
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({ method: "DELETE", url: "/identities/id-1" });

      expect(res.statusCode).toBe(403);
      expect(prisma.identity.delete).not.toHaveBeenCalled();
    });

    it("deletes for its owner", async () => {
      vi.mocked(prisma.identity.findUnique).mockResolvedValue({
        userId: OWNER_ID,
      } as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({ method: "DELETE", url: "/identities/id-1" });

      expect(res.statusCode).toBe(204);
      expect(prisma.identity.delete).toHaveBeenCalledWith({
        where: { id: "id-1" },
      });
    });
  });

  describe("GET /users/:id/identities", () => {
    it("returns 403 rather than another user's list", async () => {
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({
        method: "GET",
        url: `/users/${OWNER_ID}/identities`,
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identity.findMany).not.toHaveBeenCalled();
    });

    it("returns the caller's own list", async () => {
      vi.mocked(prisma.identity.findMany).mockResolvedValue([] as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({
        method: "GET",
        url: `/users/${OWNER_ID}/identities`,
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("POST /identities", () => {
    it("attributes the new identity to the caller's session, not to a userId supplied in the body", async () => {
      vi.mocked(prisma.identity.create).mockResolvedValue({
        id: "id-new",
        userId: OWNER_ID,
      } as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({
        method: "POST",
        url: "/identities",
        payload: {
          userId: OTHER_ID, // an attacker-controlled body field — must be ignored
          contextId: "ctx-1",
          validFrom: "2026-01-01",
          givenName: "Ada",
          displayName: "Ada",
        },
      });

      expect(res.statusCode).toBe(201);
      expect(prisma.identity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: OWNER_ID }),
        }),
      );
    });
  });
});
