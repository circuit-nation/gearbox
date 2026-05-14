import { NextResponse } from "next/server";

export async function nextResponseFromUpstream(upstream: Response) {
  const contentType = upstream.headers.get("content-type") || "application/json";
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
    },
  });
}
