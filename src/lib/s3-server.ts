import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ENV } from "@/config/config";
import type { S3ObjectLocation } from "@/lib/image-storage";

if (
  !ENV.CN_AWS_S3_REGION ||
  !ENV.CN_AWS_ACCESS_KEY ||
  !ENV.CN_AWS_SECRET_KEY ||
  !ENV.CN_S3_BUCKET
) {
  throw new Error("S3 server configuration is incomplete.");
}

const s3 = new S3Client({
  region: ENV.CN_AWS_S3_REGION,
  credentials: {
    accessKeyId: ENV.CN_AWS_ACCESS_KEY,
    secretAccessKey: ENV.CN_AWS_SECRET_KEY,
  },
});

export async function deleteS3Object({ bucket, key }: S3ObjectLocation) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
