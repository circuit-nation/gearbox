import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { createYoutubeService } from "./service";

const config = {
  apiKey: "test-key",
  channelHandle: "circuit_nation",
  defaultLimit: 5,
  maxLimit: 25,
  cacheTtlMs: 0,
  shortMaxSeconds: 120,
  playlistFetchSize: 50,
};

afterEach(() => {
  mock.restoreAll();
});

describe("createYoutubeService", () => {
  it("fetches and maps videos in playlist order", async () => {
    const fetchMock = mock.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("/channels?")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "UC123",
                contentDetails: { relatedPlaylists: { uploads: "UU123" } },
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/playlistItems?")) {
        return new Response(
          JSON.stringify({
            items: [
              { contentDetails: { videoId: "vid-new" } },
              { contentDetails: { videoId: "vid-old" } },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/videos?")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "vid-old",
                snippet: {
                  title: "Older",
                  publishedAt: "2026-06-01T12:00:00Z",
                  thumbnails: { high: { url: "https://i.ytimg.com/vi/vid-old/hqdefault.jpg" } },
                },
                contentDetails: { duration: "PT1M" },
                statistics: { viewCount: "100" },
              },
              {
                id: "vid-new",
                snippet: {
                  title: "Newer",
                  publishedAt: "2026-06-14T12:00:00Z",
                  thumbnails: { high: { url: "https://i.ytimg.com/vi/vid-new/hqdefault.jpg" } },
                },
                contentDetails: { duration: "PT9M10S" },
                statistics: { viewCount: "88000" },
              },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response("not found", { status: 404 });
    });

    const service = createYoutubeService({
      config,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const videos = await service.getLatestVideos(2, "all");

    assert.equal(videos.length, 2);
    assert.equal(videos[0]?.id, "vid-new");
    assert.equal(videos[1]?.id, "vid-old");
    assert.equal(videos[0]?.durationSeconds, 550);
    assert.equal(videos[0]?.format, "long");
    assert.equal(videos[1]?.format, "short");
    assert.equal(fetchMock.mock.callCount(), 3);
  });

  it("filters to long-form by default", async () => {
    const fetchMock = mock.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("/channels?")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "UC123",
                contentDetails: { relatedPlaylists: { uploads: "UU123" } },
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/playlistItems?")) {
        return new Response(
          JSON.stringify({
            items: [
              { contentDetails: { videoId: "short-1" } },
              { contentDetails: { videoId: "long-1" } },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/videos?")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "short-1",
                snippet: {
                  title: "Short clip",
                  publishedAt: "2026-06-14T12:00:00Z",
                  thumbnails: { high: { url: "https://i.ytimg.com/vi/short-1/hqdefault.jpg" } },
                },
                contentDetails: { duration: "PT30S" },
                statistics: { viewCount: "1000" },
              },
              {
                id: "long-1",
                snippet: {
                  title: "Long video",
                  publishedAt: "2026-06-01T12:00:00Z",
                  thumbnails: { high: { url: "https://i.ytimg.com/vi/long-1/hqdefault.jpg" } },
                },
                contentDetails: { duration: "PT10M" },
                statistics: { viewCount: "5000" },
              },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response("not found", { status: 404 });
    });

    const service = createYoutubeService({
      config,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const videos = await service.getLatestVideos(5);

    assert.equal(videos.length, 1);
    assert.equal(videos[0]?.id, "long-1");
    assert.equal(videos[0]?.format, "long");
  });

  it("reuses cached channel on second call", async () => {
    let channelCalls = 0;
    const fetchMock = mock.fn(async (input: string | URL) => {
      const url = String(input);

      if (url.includes("/channels?")) {
        channelCalls += 1;
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "UC123",
                contentDetails: { relatedPlaylists: { uploads: "UU123" } },
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url.includes("/playlistItems?")) {
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }

      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });

    const service = createYoutubeService({
      config,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    await service.getLatestVideos(5);
    await service.getLatestVideos(5);

    assert.equal(channelCalls, 1);
  });
});
