import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { connectToDatabase } from "@/lib/mongodb";
import { ArticleModel } from "@/lib/models/article.models";

const parser = new Parser();

export function normalizeArticleGuid(guid: string, url: string): string {
  const trimmed = guid.trim();
  if (trimmed) return trimmed;
  return createHash("sha256").update(url.trim().toLowerCase()).digest("hex");
}

function extractThumbnail(item: Parser.Item): string {
  const enclosure = item.enclosure?.url;
  if (enclosure) return enclosure;
  const media = (item as { "media:content"?: { $?: { url?: string } } })["media:content"]?.$?.url;
  return media ?? "";
}

export async function syncArticlesFromRss() {
  await connectToDatabase();
  const feedUrl = process.env.SUBSTACK_RSS_URL ?? "https://circuitnation.substack.com/feed";
  const feed = await parser.parseURL(feedUrl);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of feed.items) {
    const url = (item.link ?? "").trim();
    if (!url) {
      skipped++;
      continue;
    }

    const guid = normalizeArticleGuid(item.guid ?? "", url);
    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
    const contentFields = {
      guid,
      url,
      title: item.title ?? "Untitled",
      excerpt: item.contentSnippet ?? item.summary ?? "",
      thumbnail: extractThumbnail(item),
      publishedAt,
      syncedAt: new Date(),
    };

    const byGuid = await ArticleModel.findOne({ guid }).lean();
    if (byGuid) {
      await ArticleModel.updateOne({ guid }, { $set: contentFields });
      updated++;
      continue;
    }

    const byUrl = await ArticleModel.findOne({ url }).lean();
    if (byUrl) {
      await ArticleModel.updateOne({ url }, { $set: { ...contentFields, guid: byUrl.guid } });
      updated++;
      continue;
    }

    await ArticleModel.create({ ...contentFields, status: "draft" });
    inserted++;
  }

  return { inserted, updated, skipped };
}
