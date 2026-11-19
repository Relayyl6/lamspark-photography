import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { triageInboundMessage } from "@/lib/ai/service";

const sql = neon(process.env.DATABASE_URL!);

// 1. Verification endpoint for Meta Cloud API webhook
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

// 2. Inbound messages from Meta Cloud API
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const entries = payload?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];

        for (const msg of messages) {
          const fromPhone = msg.from; // e.g. "2349064982841"
          const textBody = msg.text?.body || (msg.type === "image" ? "[Image Receipt Attached]" : "");
          const profileName = contacts[0]?.profile?.name || `Client +${fromPhone}`;

          // Check for STOP command
          if (textBody.trim().toUpperCase() === "STOP") {
            console.log(`[WhatsApp Webhook] STOP received from ${fromPhone}`);
            continue;
          }

          // Find or create conversation in Neon DB
          let convs = await sql`
            SELECT id FROM conversation
            WHERE client_id IN (SELECT id FROM client WHERE phone LIKE ${'%' + fromPhone + '%'})
            LIMIT 1
          `;

          let convId = convs[0]?.id;

          if (!convId) {
            // Create client first if not exists
            const clientRes = await sql`
              INSERT INTO client (id, name, phone, created_at, updated_at)
              VALUES (gen_random_uuid(), ${profileName}, ${'+' + fromPhone}, NOW(), NOW())
              RETURNING id
            `;
            const clientId = clientRes[0].id;

            // Create conversation
            const convRes = await sql`
              INSERT INTO conversation (id, client_id, channel, state, created_at, updated_at)
              VALUES (gen_random_uuid(), ${clientId}, 'whatsapp', 'ai', NOW(), NOW())
              RETURNING id
            `;
            convId = convRes[0].id;
          }

          // Insert inbound message
          await sql`
            INSERT INTO message (
              id, conversation_id, direction, body, sent_by, status, created_at, updated_at
            )
            VALUES (
              gen_random_uuid(), ${convId}, 'inbound', ${textBody}, ${profileName}, 'delivered', NOW(), NOW()
            )
          `;

          // Update conversation timestamp
          await sql`
            UPDATE conversation
            SET updated_at = NOW()
            WHERE id = ${convId}
          `;

          // AI triage
          const triage = triageInboundMessage(textBody);
          console.log(`[WhatsApp Webhook] Ingested message from ${fromPhone} to conv ${convId}. AI label: ${triage.label}`);
        }
      }
    }

    return NextResponse.json({ status: "processed" });
  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]", error);
    return NextResponse.json({ error: error.message || "Internal processing error" }, { status: 500 });
  }
}
