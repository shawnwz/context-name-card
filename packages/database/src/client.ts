import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Append connection_limit to the URL if not already set.
// Both Next.js and Fastify share this package but run in separate processes,
// so each gets its own pool — keep it small to avoid exhausting Aiven's free tier.
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("connection_limit")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=3`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: { db: { url: getDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
