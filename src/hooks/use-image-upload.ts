import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cnApi } from "@/lib/circuit-nation/api";
import { toStoredS3Value , isStoredS3Value, storedValueToS3Key } from "@/lib/image-storage";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGE_SIZE_BYTES,
  UploadFolder,
  isAllowedImageExtension,
  isAllowedMimeTypeForExtension,
  normalizeExtension,
} from "@/lib/image-upload";

async function fetchSignedImageUrl(key: string) {
  return cnApi.images.getSignedUrl(key);
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async ({
    file,
    folder,
    entityName,
  }: {
    file: File;
    folder: UploadFolder;
    entityName: string;
  }): Promise<string> => {
    const extension = normalizeExtension(file.name.includes(".") ? file.name.split(".").pop() : "");

    if (!isAllowedImageExtension(extension)) {
      throw new Error(`Unsupported file type. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}.`);
    }

    if (!isAllowedMimeTypeForExtension(extension, file.type || "")) {
      throw new Error("File type does not match the selected format.");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("File is too large. Maximum allowed size is 10MB.");
    }

    setIsUploading(true);

    try {
      const uploadUrlPayload = await cnApi.images.getUploadUrl({
        contentType: file.type,
        extension,
        folder,
        name: entityName,
      });

      await cnApi.images.uploadToSignedUrl(uploadUrlPayload.uploadUrl, file);

      return toStoredS3Value(uploadUrlPayload.key);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}

export function useResolvedImageUrl(value: string | null | undefined) {
  const key = storedValueToS3Key(value);
  const shouldResolve = isStoredS3Value(value) && Boolean(key);

  const query = useQuery({
    queryKey: ["resolved-image-url", key],
    queryFn: () => fetchSignedImageUrl(key as string),
    enabled: shouldResolve,
    staleTime: 1000 * 60 * 50, // 50m, below signed URL expiry.
  });

  return {
    url: shouldResolve ? query.data || "" : value || "",
    isLoading: query.isLoading,
    error: query.error,
  };
}
