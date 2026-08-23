import { NextRequest } from "next/server";
import { handlers } from "../../../../auth";

// Next.js's dev server (Turbopack, as of 16.2.0) doesn't reflect the real
// incoming Host header in a Route Handler's `Request.url` — it's always
// `localhost:<port>`, regardless of which hostname/IP the client actually
// connected through. Auth.js derives its base URL (used for cookies,
// redirects, and the magic-link email body) from `request.url`, so without
// this it silently redirects everything back to `localhost` even when the
// app is reached via a LAN IP — the redirect after a successful sign-in
// then points somewhere the client can't reach, and the sign-in appears to
// silently fail. Rebuild the request with the real Host header (same
// pattern next-auth's own `AUTH_URL` override uses) so Auth.js sees the
// correct origin.
function withRealHost(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request;

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const url = new URL(request.url);
  url.protocol = protocol;
  url.host = host;

  return new NextRequest(url, request);
}

export async function GET(request: NextRequest) {
  return handlers.GET(withRealHost(request));
}

export async function POST(request: NextRequest) {
  return handlers.POST(withRealHost(request));
}
