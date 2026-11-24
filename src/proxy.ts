import { NextResponse, type NextRequest } from "next/server";

const ADMIN_REALM = 'Basic realm="TypeStrike Admin", charset="UTF-8"';
const NO_STORE = { "Cache-Control": "no-store" } as const;

interface BasicCredentials {
  username: string;
  password: string;
}

function readBasicAuth(header: string | null): BasicCredentials | null {
  if (!header) return null;
  const [scheme, encoded, ...extra] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "basic" || !encoded || extra.length > 0) return null;
  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

/** Fixed-length comparison over SHA-256 digests; runs in Next's Proxy runtime. */
async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftDigest);
  const b = new Uint8Array(rightDigest);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

function deny(message: string, status: 401 | 503): NextResponse {
  return new NextResponse(message, {
    status,
    headers: {
      ...NO_STORE,
      "WWW-Authenticate": ADMIN_REALM,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/** HTTP Basic auth for the private owner dashboard. Public routes are untouched. */
export async function proxy(request: NextRequest) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return deny("Admin dashboard is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.", 503);
  }

  const credentials = readBasicAuth(request.headers.get("authorization"));
  if (!credentials) return deny("Authentication required.", 401);

  const [usernameMatches, passwordMatches] = await Promise.all([
    constantTimeEqual(credentials.username, expectedUsername),
    constantTimeEqual(credentials.password, expectedPassword),
  ]);
  if (!usernameMatches || !passwordMatches) return deny("Invalid credentials.", 401);

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
