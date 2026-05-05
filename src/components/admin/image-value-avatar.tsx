"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useResolvedImageUrl } from "@/hooks/use-image-upload";
import { Loader2 } from "lucide-react";

type ImageValueAvatarProps = {
  value: string;
  alt: string;
  fallback: string;
  className?: string;
};

export function ImageValueAvatar({ value, alt, fallback, className }: ImageValueAvatarProps) {
  const { url, isLoading } = useResolvedImageUrl(value);

  return (
    <Avatar className={className}>
      <AvatarImage src={url} alt={alt} />
      <AvatarFallback>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : fallback}
      </AvatarFallback>
    </Avatar>
  );
}
