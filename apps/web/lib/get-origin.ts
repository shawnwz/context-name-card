import { headers } from "next/headers";

// CloudFront (infra/cdn.tf) deliberately strips the viewer's Host header
// before forwarding to the ECS origin, so `host` below is always the raw
// AWS-assigned hostname in production, never contextid.app. AUTH_URL is
// the canonical public URL already pinned for this exact reason (see
// infra/ecs.tf) — prefer it, and only fall back to request headers for
// local dev where AUTH_URL isn't set.
export async function getOrigin() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
