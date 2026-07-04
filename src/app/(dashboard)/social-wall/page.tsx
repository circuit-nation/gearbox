import { SocialWallManager } from "@/components/admin/social-wall/manager";
import { PageHeader } from "@/components/shared/page-header";

export default function SocialWallPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Wall"
        description="Curate homepage social tiles across YouTube, Reddit, Instagram, and Substack"
      />
      <SocialWallManager />
    </div>
  );
}
