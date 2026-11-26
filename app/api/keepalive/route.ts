import { NextResponse } from "next/server";
import { getWhatsAppStatusAsync } from "@/lib/integrations/whatsapp/baileys";
import { syncInstagramInbox } from "@/lib/integrations/instagram/client";

export const dynamic = "force-dynamic";

export async function GET() {
  let whatsappState = "serverless_skipped";
  let igSynced = 0;

  // On persistent Node worker (Render), keep Baileys awake and pull new IG DMs into Neon Postgres
  if (!process.env.VERCEL) {
    try {
      const wa = await getWhatsAppStatusAsync();
      whatsappState = wa.state;
    } catch {}

    try {
      igSynced = await syncInstagramInbox();
    } catch {}
  }

  return NextResponse.json({
    status: "ok",
    service: "lamsparks-build-suite",
    whatsappState,
    igSynced,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
}
