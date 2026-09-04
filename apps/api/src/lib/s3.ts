import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export function getS3Config() {
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
