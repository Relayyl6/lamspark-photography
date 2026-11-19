import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";
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
    const { action, phoneNumber, clearMessages } = body;

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
      if (clearMessages) {
        try {
          const sql = neon(process.env.DATABASE_URL!);
          await sql.query(
            `DELETE FROM message WHERE conversation_id IN (SELECT id FROM conversation WHERE channel = 'whatsapp')`
          );
          await sql.query(`DELETE FROM conversation WHERE channel = 'whatsapp'`);
        } catch (dbErr) {
          console.error("[Purge test messages error]", dbErr);
        }
      }
      return NextResponse.json({
        success: true,
        message: clearMessages
          ? "WhatsApp Web unlinked and test messages purged successfully."
          : "WhatsApp Web unlinked successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[WhatsApp Channel API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
