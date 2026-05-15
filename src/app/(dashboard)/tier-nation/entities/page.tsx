import { PageHeader } from "@/components/shared/page-header";
import { TierNationEntitiesCatalog } from "@/components/admin/tier-nation/entities-catalog";

export default function TierNationEntitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Entities"
        description="Create entities, attach them to lists, or edit and delete via admin APIs."
      />
      <TierNationEntitiesCatalog />
    </div>
  );
}
