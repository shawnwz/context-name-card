-- CreateTable
CREATE TABLE "IdentityShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "IdentityShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityShare_token_key" ON "IdentityShare"("token");

-- AddForeignKey
ALTER TABLE "IdentityShare" ADD CONSTRAINT "IdentityShare_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
