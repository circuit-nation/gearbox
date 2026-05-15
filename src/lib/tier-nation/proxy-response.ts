import { NextResponse } from "next/server";

function getProxyErrorMessage(status: number) {
  if (status === 400) {
    return "Invalid request.";
  }
  if (status === 401 || status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (status === 404) {
    return "Requested resource was not found.";
  }
  return "Tier Nation service is unavailable.";
}

export async function nextResponseFromUpstream(upstream: Response) {
  if (upstream.status === 204) {
    return NextResponse.json({ data: { success: true } }, { status: 200 });
  }

  let payload: unknown = null;
  try {
    payload = await upstream.json();
  } catch {
    payload = null;
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: getProxyErrorMessage(upstream.status) },
      { status: upstream.status }
    );
  }

  return NextResponse.json({ data: payload }, { status: upstream.status });
}
