"use client";

import { DriversManager } from "@/components/admin/drivers/manager";
import { PageHeader } from "@/components/page-header";

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers Management"
        description="Manage driver profiles"
      />
      <DriversManager />
    </div>
  );
}
