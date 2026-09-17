import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { authenticate } from "./plugins/authenticate.js";
import { identityContextRoutes } from "./routes/identityContexts.js";
import { identityRoutes } from "./routes/identities.js";
import { publicShareRoutes, shareRoutes } from "./routes/shares.js";
import { userRoutes } from "./routes/users.js";

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
app.register(publicShareRoutes);

app.get("/health", async () => {
  return { status: "ok" };
});

// Protected routes — require a valid Auth.js session token as Bearer token
app.register(async (protectedApp) => {
  protectedApp.addHook("preHandler", authenticate);
  protectedApp.register(identityContextRoutes);
  protectedApp.register(identityRoutes);
  protectedApp.register(shareRoutes);
  protectedApp.register(userRoutes);
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
