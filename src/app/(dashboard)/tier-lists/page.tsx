import { redirect } from "next/navigation";

/** Plan alias: canonical UI lives at `/tier-nation/lists`. */
export default function TierListsPage() {
  redirect("/tier-nation/lists");
}
