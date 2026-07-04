export default async () => {
  const baseUrl = process.env.URL ?? process.env.DEPLOY_URL;
  const secret = process.env.CRON_SECRET;
  if (!baseUrl || !secret) {
    console.error("Missing URL or CRON_SECRET");
    return;
  }

  const res = await fetch(`${baseUrl}/api/internal/articles/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  console.log("RSS sync status:", res.status, await res.text());
};
