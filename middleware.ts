import { NextResponse, type NextRequest } from "next/server";

const SECRET = process.env.STUDIO_AUTH_SECRET || "";
const SESSION_COOKIE_NAME = "lamsparks_session";

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "owner" | "full" | "limited";
  exp: number;
}

async function verifyEdgeToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, dataB64, signatureB64] = parts;

    // Verify signature with Web Crypto API (HMAC SHA-256)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Convert signature from base64url to Uint8Array
    const binarySig = atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/"));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const dataBytes = encoder.encode(`${headerB64}.${dataB64}`);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return null;

    const jsonStr = atob(dataB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(jsonStr) as SessionPayload;

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect studio routes
  if (pathname.startsWith("/studio")) {
    // Allow public access to login page
    if (pathname === "/studio/login") {
      // If already logged in, redirect to /studio
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const session = await verifyEdgeToken(token);
        if (session) {
          return NextResponse.redirect(new URL("/studio", request.url));
        }
      }
      return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL("/studio/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyEdgeToken(token);
    if (!session) {
      const loginUrl = new URL("/studio/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based authorization rules (09-dashboard.md):
    // Owner (Osemene): Full access to prices, templates, settings, user management, and restricted fields.
    // Full: Operational pipeline, inbox, calendar, and restricted fields.
    // Limited: Pipeline and inbox only; no restricted fields, no pricing edits, no exports.

    const isOwnerRoute =
      pathname.startsWith("/studio/settings") ||
      pathname.startsWith("/studio/pricing") ||
      pathname.startsWith("/studio/templates") ||
      pathname.startsWith("/studio/users");

    if (isOwnerRoute && session.role !== "owner") {
      // Forbidden: redirect to main studio dashboard with alert
      const forbiddenUrl = new URL("/studio", request.url);
      forbiddenUrl.searchParams.set("error", "owner_only_area");
      return NextResponse.redirect(forbiddenUrl);
    }

    const isRestrictedOrExportRoute =
      pathname.startsWith("/studio/export") ||
      pathname.startsWith("/studio/restricted-notes");

    if (isRestrictedOrExportRoute && session.role === "limited") {
      const forbiddenUrl = new URL("/studio", request.url);
      forbiddenUrl.searchParams.set("error", "elevated_role_required");
      return NextResponse.redirect(forbiddenUrl);
    }

    // Add session headers for downstream server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-email", session.email);
    requestHeaders.set("x-user-role", session.role);
    requestHeaders.set("x-user-name", session.name);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/:path*"],
};
