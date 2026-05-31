-- CreateTable
CREATE TABLE "IdentityContext" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "IdentityContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "additionalGivenName" TEXT,
    "secondaryFamilyName" TEXT,
    "displayName" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityContext_userId_name_key" ON "IdentityContext"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_userId_contextId_key" ON "Identity"("userId", "contextId");

-- AddForeignKey
ALTER TABLE "IdentityContext" ADD CONSTRAINT "IdentityContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Identity" ADD CONSTRAINT "Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Identity" ADD CONSTRAINT "Identity_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "IdentityContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
