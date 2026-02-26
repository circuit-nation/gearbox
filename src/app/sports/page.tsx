"use client";

import { SportsManager } from "@/components/admin/sports/manager";
import { PageHeader } from "@/components/page-header";

export default function SportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sports Management"
        description="Create and manage motorsport categories"
      />
      <SportsManager />
    </div>
  );
}
