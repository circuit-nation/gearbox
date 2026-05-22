import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "@/config/config";
import { parseStoredS3Value } from "@/lib/image-storage";

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

const EXPIRES_IN = 60 * 60 * 24; // 24 hours

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyParam = searchParams.get("key");
    const value = searchParams.get("value");
    const location =
      (value ? parseStoredS3Value(value, ENV.CN_S3_BUCKET) : null) ??
      (keyParam ? { bucket: ENV.CN_S3_BUCKET, key: keyParam } : null);

    if (!location?.bucket || !location.key) {
      return Response.json({ error: "Image location is required." }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: location.bucket,
      Key: location.key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: EXPIRES_IN });

    return Response.json({ data: { url } });
  } catch (error) {
    console.error("Failed to generate get image URL", error);
    return Response.json({ error: "Failed to generate image URL" }, { status: 500 });
  }
}
