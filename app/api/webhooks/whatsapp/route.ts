import { NextRequest, NextResponse } from "next/server";
import { triageInboundMessage } from "@/lib/ai/service";

// Verification endpoint for Meta Cloud API webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "lamsparks_secure_token_2026";

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Idempotent logging and processing
    const entries = payload?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const messages = change?.value?.messages || [];
        for (const msg of messages) {
          const from = msg.from;
          const text = msg.text?.body || "";
          const msgType = msg.type; // "text" | "image" | ...

          // 1. Handle STOP command immediately
          if (text.trim().toUpperCase() === "STOP") {
            // Append to STOP list & withdraw marketing consent
            console.log(`[WhatsApp Webhook] STOP received from ${from}. Marking stop-listed.`);
            continue;
          }

          // 2. Handle Transfer Screenshot (deposit reported)
          if (msgType === "image") {
            console.log(
              `[WhatsApp Webhook] Screenshot received from ${from}. Moving enquiry to 'deposit_reported' and queuing for human review.`
            );
            // Strict rule: System acknowledges receipt but NEVER confirms payment
            // "Received. A team member will verify it against our studio bank account shortly."
            continue;
          }

          // 3. Check for Reference Code pattern (e.g. LS-4F7K)
          const refMatch = text.match(/\bLS-[A-Z0-9]{4}\b/i);
          if (refMatch) {
            console.log(`[WhatsApp Webhook] Matched reference code ${refMatch[0]} from ${from}.`);
          }

          // 4. Background AI triage on incoming text
          const triage = triageInboundMessage(text);
          console.log(`[WhatsApp Webhook] AI Triage label: ${triage.label} (${triage.summary})`);
        }
      }
    }

    return NextResponse.json({ status: "processed" });
  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]", error);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
