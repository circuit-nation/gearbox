import { CircuitsManager } from "@/components/admin/circuits/manager";
import { PageHeader } from "@/components/shared/page-header";

export default function CircuitsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Circuits Management" description="Create and manage race circuits" />
      <CircuitsManager />
    </div>
  );
}
