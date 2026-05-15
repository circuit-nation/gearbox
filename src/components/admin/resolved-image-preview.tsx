"use client";

import { useResolvedImageUrl } from "@/hooks/use-image-upload";
import { Loader2 } from "lucide-react";
import Image from "next/image";

type ResolvedImagePreviewProps = {
  value?: string;
  alt: string;
  className?: string;
};

export function ResolvedImagePreview({ value, alt, className }: ResolvedImagePreviewProps) {
  const { url, isLoading } = useResolvedImageUrl(value);

  if (!value) {
    return null;
  }

  return (
    <div className={className}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          width={1080}
          height={1080}
        />
      ) : (
        <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "No preview"}
        </div>
      )}
    </div>
  );
}
