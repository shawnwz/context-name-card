import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { prisma } from "@repo/database";
import { authenticate } from "./plugins/authenticate.js";
import { identityContextRoutes } from "./routes/identityContexts.js";
import { identityRoutes } from "./routes/identities.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

const app = Fastify({ logger: true });

app.decorateRequest("userId", "");
app.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

// Public routes
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

// Protected routes — require a valid Auth.js session token as Bearer token
app.register(async (protectedApp) => {
  protectedApp.addHook("preHandler", authenticate);
  protectedApp.register(identityContextRoutes);
  protectedApp.register(identityRoutes);
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
