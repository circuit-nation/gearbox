"use client";

import { TeamsManager } from "@/components/admin/teams/manager";
import { PageHeader } from "@/components/page-header";

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams Management"
        description="Add and manage racing teams"
      />
      <TeamsManager />
    </div>
  );
}
