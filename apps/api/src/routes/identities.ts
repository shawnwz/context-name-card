import type { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";

type IdentityBody = {
  userId: string;
  contextId: string;
  validFrom: string;
  validTo?: string;
  givenName: string;
  familyName: string;
  additionalGivenName?: string;
  secondaryFamilyName?: string;
  displayName: string;
  image?: string;
};

type IdentityPatchBody = Partial<Omit<IdentityBody, "userId" | "contextId">>;

export async function identityRoutes(app: FastifyInstance) {
  // Create
  app.post<{ Body: IdentityBody }>("/identities", async (request, reply) => {
    const {
      userId,
      contextId,
      validFrom,
      validTo,
      givenName,
      familyName,
      additionalGivenName,
      secondaryFamilyName,
      displayName,
      image,
    } = request.body;

    if (!userId || !contextId || !validFrom || !givenName || !familyName || !displayName) {
      return reply.status(400).send({
        error: "userId, contextId, validFrom, givenName, familyName, and displayName are required",
      });
    }

    try {
      const identity = await prisma.identity.create({
        data: {
          userId,
          contextId,
          validFrom: new Date(validFrom),
          validTo: validTo ? new Date(validTo) : undefined,
          givenName,
          familyName,
          additionalGivenName,
          secondaryFamilyName,
          displayName,
          image,
        },
        include: { context: true },
      });
      return reply.status(201).send(identity);
    } catch (err: any) {
      if (err.code === "P2002") {
        return reply.status(409).send({ error: "An identity already exists for this user in this context" });
      }
      if (err.code === "P2003") {
        return reply.status(400).send({ error: "userId or contextId does not exist" });
      }
      throw err;
    }
  });

  // Get one
  app.get<{ Params: { id: string } }>(
    "/identities/:id",
    async (request, reply) => {
      const identity = await prisma.identity.findUnique({
        where: { id: request.params.id },
        include: { context: true },
      });

      if (!identity) {
        return reply.status(404).send({ error: "Identity not found" });
      }

      return identity;
    }
  );

  // List by user
  app.get<{ Params: { id: string } }>(
    "/users/:id/identities",
    async (request, reply) => {
      const identities = await prisma.identity.findMany({
        where: { userId: request.params.id },
        include: { context: true },
      });
      return identities;
    }
  );

  // Update
  app.patch<{
    Params: { id: string };
    Body: IdentityPatchBody;
  }>("/identities/:id", async (request, reply) => {
    const {
      validFrom,
      validTo,
      givenName,
      familyName,
      additionalGivenName,
      secondaryFamilyName,
      displayName,
      image,
    } = request.body;

    try {
      const identity = await prisma.identity.update({
        where: { id: request.params.id },
        data: {
          ...(validFrom && { validFrom: new Date(validFrom) }),
          ...(validTo !== undefined && { validTo: validTo ? new Date(validTo) : null }),
          givenName,
          familyName,
          additionalGivenName,
          secondaryFamilyName,
          displayName,
          image,
        },
        include: { context: true },
      });
      return identity;
    } catch (err: any) {
      if (err.code === "P2025") {
        return reply.status(404).send({ error: "Identity not found" });
      }
      throw err;
    }
  });

  // Delete
  app.delete<{ Params: { id: string } }>(
    "/identities/:id",
    async (request, reply) => {
      try {
        await prisma.identity.delete({
          where: { id: request.params.id },
        });
        return reply.status(204).send();
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ error: "Identity not found" });
        }
        throw err;
      }
    }
  );
}
