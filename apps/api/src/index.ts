import Fastify from "fastify";
import { prisma } from "@repo/database";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok" };
});

app.get<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
  const user = await prisma.user.findUnique({
    where: { id: request.params.id },
  });

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return user;
});

const start = async () => {
  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
