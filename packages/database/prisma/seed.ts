import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const systemContexts = ["personal", "work", "family", "social"];

  await prisma.identityContext.createMany({
    data: systemContexts.map((name) => ({ name })),
    skipDuplicates: true,  // on conflict, do nothing.
  });

  console.log(`Seeded ${systemContexts.length} system identity contexts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
