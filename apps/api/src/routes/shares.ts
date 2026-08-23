import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";

const VALID_TEMPLATES = new Set([
  "professional",
  "geometric",
  "cover",
]);

type CreateShareBody = {
  expiresAt?: string;
  template?: string;
};

export async function publicShareRoutes(app: FastifyInstance) {
  app.get<{ Params: { token: string } }>(
    "/shares/:token",
    async (request, reply) => {
      const share = await prisma.identityShare.findUnique({
        where: { token: request.params.token },
        include: {
          identity: { include: { context: true } },
        },
      });

      if (!share) {
        return reply.status(404).send({ error: "Share not found" });
      }

      if (share.revokedAt) {
        return reply.status(410).send({ error: "Share has been revoked" });
      }

      if (share.expiresAt && share.expiresAt < new Date()) {
        return reply.status(410).send({ error: "Share has expired" });
      }

      return { ...share.identity, template: share.template };
    },
  );
}

export async function shareRoutes(app: FastifyInstance) {
  // Create share
  app.post<{ Params: { id: string }; Body: CreateShareBody }>(
    "/identities/:id/shares",
    async (request, reply) => {
      const identity = await prisma.identity.findUnique({
        where: { id: request.params.id },
        select: { id: true, userId: true },
      });

      if (!identity) {
        return reply.status(404).send({ error: "Identity not found" });
      }

      if (identity.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { expiresAt, template } = request.body ?? {};

      if (template !== undefined && !VALID_TEMPLATES.has(template)) {
        return reply.status(400).send({ error: "Invalid template" });
      }

      const share = await prisma.identityShare.create({
        data: {
          token: randomBytes(9).toString("base64url"),
          identityId: identity.id,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          ...(template && { template }),
        },
      });

      return reply.status(201).send(share);
    },
  );

  // List all shares for a user (across all identities)
  app.get<{ Params: { id: string } }>(
    "/users/:id/shares",
    async (request, reply) => {
      if (request.params.id !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const shares = await prisma.identityShare.findMany({
        where: { identity: { userId: request.params.id } },
        include: {
          identity: {
            select: {
              id: true,
              displayName: true,
              image: true,
              context: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return shares;
    },
  );

  // List shares for an identity
  app.get<{ Params: { id: string } }>(
    "/identities/:id/shares",
    async (request, reply) => {
      const identity = await prisma.identity.findUnique({
        where: { id: request.params.id },
        select: { id: true, userId: true },
      });

      if (!identity) {
        return reply.status(404).send({ error: "Identity not found" });
      }

      if (identity.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const shares = await prisma.identityShare.findMany({
        where: { identityId: identity.id },
        orderBy: { createdAt: "desc" },
      });

      return shares;
    },
  );

  // Revoke share
  app.delete<{ Params: { token: string } }>(
    "/shares/:token",
    async (request, reply) => {
      const share = await prisma.identityShare.findUnique({
        where: { token: request.params.token },
        include: { identity: { select: { userId: true } } },
      });

      if (!share) {
        return reply.status(404).send({ error: "Share not found" });
      }

      if (share.identity.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      await prisma.identityShare.update({
        where: { token: request.params.token },
        data: { revokedAt: new Date() },
      });

      return reply.status(204).send();
    },
  );
}
