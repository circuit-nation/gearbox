import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toStoredS3Value } from "@/lib/image-storage";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGE_SIZE_BYTES,
  UploadFolder,
  isAllowedImageExtension,
  isAllowedMimeTypeForExtension,
  normalizeExtension,
} from "@/lib/image-upload";
import { isStoredS3Value, storedValueToS3Key } from "@/lib/image-storage";

type UploadUrlResponse = {
  uploadUrl?: string;
  key?: string;
  error?: string;
};

type GetImageUrlResponse = {
  url?: string;
  error?: string;
};

async function fetchSignedImageUrl(key: string) {
  const response = await fetch(`/api/get-image-url?key=${encodeURIComponent(key)}`);
  const payload = (await response.json()) as GetImageUrlResponse;

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "Failed to resolve image URL.");
  }

  return payload.url;
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
      throw new Error(
        `Unsupported file type. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}.`
      );
    }

    if (!isAllowedMimeTypeForExtension(extension, file.type || "")) {
      throw new Error("File type does not match the selected format.");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("File is too large. Maximum allowed size is 10MB.");
    }

    setIsUploading(true);

    try {
      const uploadUrlResponse = await fetch(
        `/api/upload-url?contentType=${encodeURIComponent(file.type)}&extension=${encodeURIComponent(extension)}&folder=${encodeURIComponent(folder)}&name=${encodeURIComponent(entityName)}`
      );
      const uploadUrlPayload = (await uploadUrlResponse.json()) as UploadUrlResponse;

      if (!uploadUrlResponse.ok || !uploadUrlPayload.uploadUrl || !uploadUrlPayload.key) {
        throw new Error(uploadUrlPayload.error || "Failed to get upload URL.");
      }

      const uploadResponse = await fetch(uploadUrlPayload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image.");
      }

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
