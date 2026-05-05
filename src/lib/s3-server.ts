import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.CN_AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.CN_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.CN_AWS_SECRET_KEY!,
  },
});

export async function deleteS3ObjectByKey(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.CN_S3_BUCKET!,
      Key: key,
    })
  );
}

