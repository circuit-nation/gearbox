"use client";

import { TierNationListDetailManager } from "@/components/admin/tier-nation/list-detail-manager";
import { useParams } from "next/navigation";

export default function TierNationListDetailPage() {
  const params = useParams();
  const listId = typeof params.listId === "string" ? params.listId : "";

  if (!listId) {
    return <div className="text-sm text-muted-foreground">Missing list id.</div>;
  }

  return <TierNationListDetailManager listId={listId} />;
}
