import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@repo/database";
import { identityContextRoutes } from "./identityContexts.js";

vi.mock("@repo/database", () => ({
  prisma: {
    identityContext: {
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

async function buildApp(callerId: string) {
  const app = Fastify();
  app.decorateRequest("userId", "");
  app.addHook("preHandler", async (request: FastifyRequest) => {
    request.userId = callerId;
  });
  await app.register(identityContextRoutes);
  return app;
}

describe("identity-context ownership checks", () => {
  beforeEach(() => {
    vi.mocked(prisma.identityContext.findUnique).mockReset();
    vi.mocked(prisma.identityContext.findMany).mockReset();
    vi.mocked(prisma.identityContext.create).mockReset();
    vi.mocked(prisma.identityContext.update).mockReset();
    vi.mocked(prisma.identityContext.delete).mockReset();
  });

  describe("GET /identity-contexts/:id", () => {
    it("returns 403 rather than another user's custom context", async () => {
      vi.mocked(prisma.identityContext.findUnique).mockResolvedValue({
        id: "ctx-1",
        userId: OWNER_ID,
        name: "Freelance",
      } as never);
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({ method: "GET", url: "/identity-contexts/ctx-1" });

      expect(res.statusCode).toBe(403);
    });

    it("returns a system context (null userId) to any authenticated caller", async () => {
      vi.mocked(prisma.identityContext.findUnique).mockResolvedValue({
        id: "ctx-system",
        userId: null,
        name: "Professional",
      } as never);
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({
        method: "GET",
        url: "/identity-contexts/ctx-system",
      });

      expect(res.statusCode).toBe(200);
    });

    it("returns a custom context to its owner", async () => {
      vi.mocked(prisma.identityContext.findUnique).mockResolvedValue({
        id: "ctx-1",
        userId: OWNER_ID,
        name: "Freelance",
      } as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({ method: "GET", url: "/identity-contexts/ctx-1" });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("PATCH /identity-contexts/:id", () => {
    it("returns 403 rather than renaming another user's context", async () => {
      vi.mocked(prisma.identityContext.findUnique).mockResolvedValue({
        userId: OWNER_ID,
      } as never);
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({
        method: "PATCH",
        url: "/identity-contexts/ctx-1",
        payload: { name: "Hijacked" },
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityContext.update).not.toHaveBeenCalled();
    });

    it("returns 403 rather than editing a system context (null userId), even for its 'creator'", async () => {
      vi.mocked(prisma.identityContext.findUnique).mockResolvedValue({
        userId: null,
      } as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({
        method: "PATCH",
        url: "/identity-contexts/ctx-system",
        payload: { name: "Hijacked" },
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityContext.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /identity-contexts/:id", () => {
    it("returns 403 rather than deleting another user's context", async () => {
      vi.mocked(prisma.identityContext.findUnique).mockResolvedValue({
        userId: OWNER_ID,
      } as never);
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({ method: "DELETE", url: "/identity-contexts/ctx-1" });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityContext.delete).not.toHaveBeenCalled();
    });

    it("deletes for its owner", async () => {
      vi.mocked(prisma.identityContext.findUnique).mockResolvedValue({
        userId: OWNER_ID,
      } as never);
      const app = await buildApp(OWNER_ID);

      const res = await app.inject({ method: "DELETE", url: "/identity-contexts/ctx-1" });

      expect(res.statusCode).toBe(204);
    });
  });

  describe("GET /users/:id/identity-contexts", () => {
    it("returns 403 rather than another user's list", async () => {
      const app = await buildApp(OTHER_ID);

      const res = await app.inject({
        method: "GET",
        url: `/users/${OWNER_ID}/identity-contexts`,
      });

      expect(res.statusCode).toBe(403);
      expect(prisma.identityContext.findMany).not.toHaveBeenCalled();
    });
  });
});
