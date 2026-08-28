import type { FastifyInstance } from "fastify";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@repo/database";

type IdentityBody = {
  contextId: string;
  validFrom: string;
  validTo?: string;
  courtesyTitle?: string;
  givenName: string;
  familyName: string;
  additionalGivenName?: string;
  secondaryFamilyName?: string;
  displayName: string;
  image?: string;
  background?: string;
  email?: string;
  description?: string;
  location?: string;
  tel?: string;
};

type IdentityPatchBody = Partial<Omit<IdentityBody, "contextId">>;

// Mirrored in apps/web/lib/identity-limits.ts — keep both in sync.
const DESCRIPTION_MAX_LENGTH = 200;
const NAME_MAX_LENGTH = 100;
const LOCATION_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const TEL_MAX_LENGTH = 30;

function validateFieldLengths(body: {
  givenName?: string;
  familyName?: string;
  additionalGivenName?: string;
  secondaryFamilyName?: string;
  displayName?: string;
  email?: string;
  description?: string;
  location?: string;
  tel?: string;
}): string | null {
  const nameFields: [string, string | undefined][] = [
    ["givenName", body.givenName],
    ["familyName", body.familyName],
    ["additionalGivenName", body.additionalGivenName],
    ["secondaryFamilyName", body.secondaryFamilyName],
    ["displayName", body.displayName],
  ];
  for (const [field, value] of nameFields) {
    if (value && value.length > NAME_MAX_LENGTH) {
      return `${field} must be at most ${NAME_MAX_LENGTH} characters`;
    }
  }
  if (body.description && body.description.length > DESCRIPTION_MAX_LENGTH) {
    return `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`;
  }
  if (body.location && body.location.length > LOCATION_MAX_LENGTH) {
    return `location must be at most ${LOCATION_MAX_LENGTH} characters`;
  }
  if (body.email && body.email.length > EMAIL_MAX_LENGTH) {
    return `email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }
  if (body.tel && body.tel.length > TEL_MAX_LENGTH) {
    return `tel must be at most ${TEL_MAX_LENGTH} characters`;
  }
  return null;
}

const allowedHeadImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const headImageExtensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

function getS3Config() {
  const bucket = process.env.S3_BUCKET_NAME;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  if (!bucket || !publicBaseUrl) {
    throw new Error("S3_BUCKET_NAME and S3_PUBLIC_BASE_URL are required");
  }

  return {
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
  };
}

export async function identityRoutes(app: FastifyInstance) {
  // Create
  app.post<{ Body: IdentityBody }>("/identities", async (request, reply) => {
    const userId = request.userId;
    const {
      contextId,
      validFrom,
      validTo,
      courtesyTitle,
      givenName,
      familyName,
      additionalGivenName,
      secondaryFamilyName,
      displayName,
      image,
      background,
      email,
      description,
      location,
      tel,
    } = request.body;

    if (!contextId || !validFrom || !givenName || !familyName || !displayName) {
      return reply.status(400).send({
        error:
          "contextId, validFrom, givenName, familyName, and displayName are required",
      });
    }

    const lengthError = validateFieldLengths({
      givenName,
      familyName,
      additionalGivenName,
      secondaryFamilyName,
      displayName,
      email,
      description,
      location,
      tel,
    });
    if (lengthError) {
      return reply.status(400).send({ error: lengthError });
    }

    try {
      const identity = await prisma.identity.create({
        data: {
          userId,
          contextId,
          validFrom: new Date(validFrom),
          validTo: validTo ? new Date(validTo) : undefined,
          courtesyTitle,
          givenName,
          familyName,
          additionalGivenName,
          secondaryFamilyName,
          displayName,
          image,
          background,
          email,
          description,
          location,
          tel,
        },
        include: { context: true },
      });
      return reply.status(201).send(identity);
    } catch (err: any) {
      if (err.code === "P2002") {
        return reply
          .status(409)
          .send({
            error: "An identity already exists for this user in this context",
          });
      }
      if (err.code === "P2003") {
        return reply
          .status(400)
          .send({ error: "userId or contextId does not exist" });
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

      if (identity.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      return identity;
    },
  );

  // List by user
  app.get<{ Params: { id: string } }>(
    "/users/:id/identities",
    async (request, reply) => {
      if (request.params.id !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const identities = await prisma.identity.findMany({
        where: { userId: request.params.id },
        include: { context: true },
      });
      return identities;
    },
  );

  // Update
  app.patch<{
    Params: { id: string };
    Body: IdentityPatchBody;
  }>("/identities/:id", async (request, reply) => {
    const existing = await prisma.identity.findUnique({
      where: { id: request.params.id },
      select: { userId: true },
    });

    if (!existing) {
      return reply.status(404).send({ error: "Identity not found" });
    }

    if (existing.userId !== request.userId) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const {
      validFrom,
      validTo,
      courtesyTitle,
      givenName,
      familyName,
      additionalGivenName,
      secondaryFamilyName,
      displayName,
      image,
      background,
      email,
      description,
      location,
      tel,
    } = request.body;

    const lengthError = validateFieldLengths({
      givenName,
      familyName,
      additionalGivenName,
      secondaryFamilyName,
      displayName,
      email,
      description,
      location,
      tel,
    });
    if (lengthError) {
      return reply.status(400).send({ error: lengthError });
    }

    try {
      const identity = await prisma.identity.update({
        where: { id: request.params.id },
        data: {
          ...(validFrom && { validFrom: new Date(validFrom) }),
          ...(validTo !== undefined && {
            validTo: validTo ? new Date(validTo) : null,
          }),
          courtesyTitle,
          givenName,
          familyName,
          additionalGivenName,
          secondaryFamilyName,
          displayName,
          image,
          background,
          email,
          description,
          location,
          tel,
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

  app.post<{ Params: { id: string } }>(
    "/identities/:id/head-image",
    async (request, reply) => {
      const identity = await prisma.identity.findUnique({
        where: { id: request.params.id },
        select: { id: true, userId: true },
      });

      if (!identity) {
        return reply.status(404).send({ error: "Identity not found" });
      }

      if (identity.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const file = await request.file();

      if (!file) {
        return reply.status(400).send({ error: "Head image file is required" });
      }

      if (!allowedHeadImageTypes.has(file.mimetype)) {
        return reply
          .status(400)
          .send({ error: "Head image must be a JPEG, PNG, or WebP file" });
      }

      const buffer = await file.toBuffer();
      const extension = headImageExtensionByType[file.mimetype];

      if (!extension) {
        return reply.status(400).send({ error: "Unsupported head image type" });
      }

      const { bucket, publicBaseUrl } = getS3Config();
      const key = `users/${identity.userId}/identities/${identity.id}/head-image.${extension}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.mimetype,
        }),
      );

      const image = `${publicBaseUrl}/${key}`;
      const updatedIdentity = await prisma.identity.update({
        where: { id: identity.id },
        data: { image },
        include: { context: true },
      });

      return updatedIdentity;
    },
  );

  // Delete
  app.delete<{ Params: { id: string } }>(
    "/identities/:id",
    async (request, reply) => {
      const existing = await prisma.identity.findUnique({
        where: { id: request.params.id },
        select: { userId: true },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Identity not found" });
      }

      if (existing.userId !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

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
    },
  );
}
