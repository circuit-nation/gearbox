"use client";

import { PageHeader } from "@/components/page-header";
import { TierNationListsCatalog } from "@/components/admin/tier-nation/lists-catalog";

export default function TierNationListsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lists"
        description="Browse voting lists, create new ones, edit or hard-delete via admin APIs, and open a list for entity management."
      />
      <TierNationListsCatalog />
    </div>
  );
}
