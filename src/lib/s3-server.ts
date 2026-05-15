import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ENV } from "@/config/config";

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

export async function deleteS3ObjectByKey(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: ENV.CN_S3_BUCKET,
      Key: key,
    })
  );
}
