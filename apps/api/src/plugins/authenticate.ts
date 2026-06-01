import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@repo/database";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
  });

  if (!session || session.expires < new Date()) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  request.userId = session.userId;
}
