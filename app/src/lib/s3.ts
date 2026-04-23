import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ApiError } from "@/lib/api-response";
import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";

let s3Client: S3Client | null = null;

function getClient() {
  if (s3Client) {
    return s3Client;
  }

  if (!env.awsAccessKeyId || !env.awsSecretAccessKey || !env.awsS3Bucket) {
    throw new ApiError(500, "S3 is not configured.");
  }

  s3Client = new S3Client({
    region: env.awsRegion,
    credentials: {
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey,
    },
  });

  return s3Client;
}

export function buildS3ObjectKey(companyId: string, fileName: string) {
  const cleanName = slugify(fileName.replace(/\.[^.]+$/, ""));
  const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
  return `companies/${companyId}/properties/${Date.now()}-${cleanName}${extension}`;
}

export function getPublicAssetUrl(key: string) {
  if (env.awsS3PublicBaseUrl) {
    return `${env.awsS3PublicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  return `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
}

export async function createSignedUploadUrl(companyId: string, fileName: string, contentType: string) {
  const client = getClient();
  const key = buildS3ObjectKey(companyId, fileName);
  const command = new PutObjectCommand({
    Bucket: env.awsS3Bucket,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  return {
    key,
    uploadUrl,
    publicUrl: getPublicAssetUrl(key),
  };
}

