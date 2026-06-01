import { auth } from "../../../../auth";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Browser can't read cookie since it's HttpOnly
//server side code can read the cookie
//This is safer protection from XSS attacks, but still need HTTPS to avoid network interception.
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // 1. Verify the user has an active session
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Read the session token from the HttpOnly cookie
  //    Auth.js uses "authjs.session-token" in dev, "__Secure-authjs.session-token" in prod (HTTPS)
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Build the upstream URL, preserving path and query string
  const { path } = await params;
  const targetUrl = `${API_URL}/${path.join("/")}${request.nextUrl.search}`;

  // 4. Forward only safe headers — inject the Bearer token
  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Authorization", `Bearer ${sessionToken}`);
  const contentType = request.headers.get("content-type");
  if (contentType) upstreamHeaders.set("content-type", contentType);

  const hasBody = !["GET", "HEAD"].includes(request.method);

  // 5. Forward request to Fastify
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: hasBody ? request.body : undefined,
      // @ts-expect-error — required by the Fetch spec when streaming a request body
      duplex: hasBody ? "half" : undefined,
    });
  } catch {
    return NextResponse.json({ error: "API unavailable" }, { status: 502 });
  }

  // 6. Stream the response back to the browser
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("transfer-encoding"); // hop-by-hop, must not be forwarded

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
