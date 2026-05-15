import { TierNationListDetailManager } from "@/components/admin/tier-nation/list-detail-manager";
type PageProps = {
  params: Promise<{ listId: string }>;
};

export default async function TierNationListDetailPage({ params }: PageProps) {
  const { listId } = await params;
  return <TierNationListDetailManager listId={listId} />;
}
