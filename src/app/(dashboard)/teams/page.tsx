import { TeamsManager } from "@/components/admin/teams/manager";
import { PageHeader } from "@/components/shared/page-header";

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Teams Management" description="Create and manage racing teams" />
      <TeamsManager />
    </div>
  );
}
