"use client";

import { LeaderboardManager } from "@/components/admin/leaderboard/manager";
import { PageHeader } from "@/components/page-header";

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard Management"
        description="Manage driver points and track team standings aggregated from drivers"
      />
      <LeaderboardManager />
    </div>
  );
}
