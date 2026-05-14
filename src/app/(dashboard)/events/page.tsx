"use client";

import { EventsManager } from "@/components/admin/events/manager";
import { PageHeader } from "@/components/page-header";

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Events Management"
        description="Schedule and manage racing events"
      />
      <EventsManager />
    </div>
  );
}
