import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getInstagramStatus,
  loginInstagram,
  syncInstagramInbox,
  logoutInstagram,
} from "@/lib/integrations/instagram/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = getInstagramStatus();
  return NextResponse.json({ success: true, status });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, username, password } = body;

    if (action === "login") {
      if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
      }
      const status = await loginInstagram(username, password);
      return NextResponse.json({ success: true, status });
    }

    if (action === "sync") {
      const newCount = await syncInstagramInbox();
      return NextResponse.json({ success: true, newMessagesCount: newCount });
    }

    if (action === "logout") {
      await logoutInstagram();
      return NextResponse.json({ success: true, message: "Instagram session logged out." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Instagram Channel API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
