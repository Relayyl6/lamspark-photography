import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION || "us-east-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

export const PUBLIC_BUCKET = "portfolio-assets";
export const PRIVATE_BUCKET = "receipt-screenshots";

function getS3Client(): S3Client {
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing S3/Neon Object Storage credentials in environment (AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)."
    );
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // required by Neon Object Storage
  });
}

export async function uploadObject({
  bucket,
  key,
  body,
  contentType,
}: {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
}): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);

  if (bucket === PUBLIC_BUCKET) {
    // Direct public URL for public_read bucket
    return `${endpoint}/${bucket}/${key}`;
  }

  // Private key identifier
  return key;
}

export async function getPrivateObjectUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: PRIVATE_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
