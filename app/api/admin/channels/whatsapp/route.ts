import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getWhatsAppStatus,
  initWhatsApp,
  disconnectWhatsApp,
} from "@/lib/integrations/whatsapp/baileys";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = getWhatsAppStatus();
  return NextResponse.json({ success: true, status });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, phoneNumber } = body;

    if (action === "start") {
      const status = await initWhatsApp({ phoneNumber });
      return NextResponse.json({ success: true, status });
    }

    if (action === "pair") {
      const status = await initWhatsApp({ phoneNumber: phoneNumber || "+2348130847299" });
      return NextResponse.json({ success: true, status });
    }

    if (action === "disconnect") {
      await disconnectWhatsApp();
      return NextResponse.json({ success: true, message: "WhatsApp Web unlinked successfully." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[WhatsApp Channel API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
