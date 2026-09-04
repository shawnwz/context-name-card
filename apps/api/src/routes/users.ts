import type { FastifyInstance } from "fastify";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { prisma } from "@repo/database";
import { getS3Config, s3Client } from "../lib/s3.js";

// Best-effort cleanup of everything uploaded for this user (currently just
// head images, all stored under this one prefix — see identities.ts).
// Called only after the DB delete has already committed, so a failure here
// never leaves an account half-deleted; it just orphans some S3 objects,
// which is a stated limitation rather than something we retry inline.
async function deleteUserS3Objects(app: FastifyInstance, userId: string) {
  const { bucket } = getS3Config();
  const prefix = `users/${userId}/`;

  try {
    let continuationToken: string | undefined;
    do {
      const listed = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const keys = (listed.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => Boolean(key));

      if (keys.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          }),
        );
      }

      continuationToken = listed.IsTruncated
        ? listed.NextContinuationToken
        : undefined;
    } while (continuationToken);
  } catch (err) {
    app.log.error(
      { err, userId },
      "failed to clean up S3 objects for deleted user",
    );
  }
}

export async function userRoutes(app: FastifyInstance) {
  app.delete<{ Params: { id: string } }>(
    "/users/:id",
    async (request, reply) => {
      if (request.params.id !== request.userId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      try {
        await prisma.user.delete({ where: { id: request.params.id } });
      } catch (err: any) {
        if (err.code === "P2025") {
          return reply.status(404).send({ error: "User not found" });
        }
        throw err;
      }

      await deleteUserS3Objects(app, request.params.id);

      return reply.status(204).send();
    },
  );
}
