import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  isAllowedImageExtension,
  isAllowedMimeTypeForExtension,
  isAllowedUploadFolder,
  normalizeExtension,
  sanitizeObjectName,
} from "@/lib/image-upload";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contentType = (searchParams.get("contentType") || "").toLowerCase();
    const extension = normalizeExtension(searchParams.get("extension"));
    const folder = searchParams.get("folder");
    const name = searchParams.get("name");

    if (!isAllowedUploadFolder(folder)) {
      return Response.json({ error: "Invalid folder." }, { status: 400 });
    }

    if (!isAllowedImageExtension(extension)) {
      return Response.json(
        { error: `Invalid extension. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}.` },
        { status: 400 }
      );
    }

    if (!isAllowedMimeTypeForExtension(extension, contentType)) {
      return Response.json({ error: "Invalid content type for extension." }, { status: 400 });
    }

    const objectName = sanitizeObjectName(name);
    const timestamp = Date.now();
    const fileName = `${folder}/${objectName}_${timestamp}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: fileName,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    return Response.json({
      uploadUrl,
      key: fileName,
    });
  } catch (error) {
    console.error("Failed to generate upload URL", error);
    return Response.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
