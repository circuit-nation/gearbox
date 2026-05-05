import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storedValueToS3Key } from "@/lib/image-storage";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

const EXPIRES_IN = 60 * 60 * 24; // 24 hours

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyParam = searchParams.get("key");
    const value = searchParams.get("value");
    const key = keyParam || storedValueToS3Key(value);

    if (!key) {
      return Response.json(
        { error: "Missing required query param: key" },
        { status: 400 },
      );
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: EXPIRES_IN });

    return Response.json({ url });
  } catch (error) {
    console.error("Failed to generate get image URL", error);
    return Response.json(
      { error: "Failed to generate image URL" },
      { status: 500 },
    );
  }
}
