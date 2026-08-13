import type { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";

export async function identityContextRoutes(app: FastifyInstance) {
  // Create
  app.post<{
    Body: { name: string };
  }>("/identity-contexts", async (request, reply) => {
    const { name } = request.body;

    if (!name) {
      return reply.status(400).send({ error: "name is required" });
    }

    try {
      const context = await prisma.identityContext.create({
        data: { name, userId: request.userId },
      });
      return reply.status(201).send(context);
    } catch (err: any) {
      if (err.code === "P2002") {
        return reply.status(409).send({ error: "Context name already exists for this user" });
      }
      throw err;
    }
  });

  // Get one
  app.get<{ Params: { id: string } }>(
    "/identity-contexts/:id",
    async (request, reply) => {
      const context = await prisma.identityContext.findUnique({
        where: { id: request.params.id },
        include: { identities: true },
      });

      if (!context) {
        return reply.status(404).send({ error: "IdentityContext not found" });
      }

      if (context.userId !== null && context.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      return context;
    }
  );

  // List by user
  app.get<{ Params: { id: string } }>(
    "/users/:id/identity-contexts",
    async (request, reply) => {
      if (request.params.id !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const contexts = await prisma.identityContext.findMany({
        where: { userId: request.params.id },
        include: { identities: true },
      });
      return contexts;
    }
  );

  // Update
  app.patch<{
    Params: { id: string };
    Body: { name?: string };
  }>("/identity-contexts/:id", async (request, reply) => {
    const { name } = request.body;

    const existing = await prisma.identityContext.findUnique({
      where: { id: request.params.id },
      select: { userId: true },
    });

    if (!existing) {
      return reply.status(404).send({ error: "IdentityContext not found" });
    }

    if (existing.userId === null || existing.userId !== request.userId) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      const context = await prisma.identityContext.update({
        where: { id: request.params.id },
        data: { name },
      });
      return context;
    } catch (err: any) {
      if (err.code === "P2025") {
        return reply.status(404).send({ error: "IdentityContext not found" });
      }
      if (err.code === "P2002") {
        return reply.status(409).send({ error: "Context name already exists for this user" });
      }
      throw err;
    }
  });

  // Delete
  app.delete<{ Params: { id: string } }>(
    "/identity-contexts/:id",
    async (request, reply) => {
      const existing = await prisma.identityContext.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      });

      if (!existing) {
        return reply.status(404).send({ error: "IdentityContext not found" });
      }

      if (existing.userId === null || existing.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      try {
        await prisma.identityContext.delete({
          where: { id: request.params.id },
        });
        return reply.status(204).send();
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ error: "IdentityContext not found" });
        }
        throw err;
      }
    }
  );
}
