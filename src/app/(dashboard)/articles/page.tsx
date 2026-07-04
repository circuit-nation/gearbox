import { ArticlesManager } from "@/components/admin/articles/manager";
import { PageHeader } from "@/components/shared/page-header";

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles Management"
        description="Sync Substack articles and manage publish status"
      />
      <ArticlesManager />
    </div>
  );
}
