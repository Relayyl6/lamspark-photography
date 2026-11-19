import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { triageInboundMessage } from "@/lib/ai/service";

const sql = neon(process.env.DATABASE_URL!);

// 1. Verification endpoint for Meta Instagram Graph API webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const WEBHOOK_VERIFY_TOKEN =
    process.env.INSTAGRAM_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "lamsparks_secure_token_2026";

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Instagram webhook verification failed" }, { status: 403 });
}

// 2. Inbound Instagram messages from Meta Graph API
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const entries = payload?.entry || [];
    for (const entry of entries) {
      const messaging = entry?.messaging || [];

      for (const item of messaging) {
        const senderId = item.sender?.id; // Scoped Instagram User ID
        const textBody = item.message?.text || (item.message?.attachments ? "[Media / Photo Attachment]" : "");

        if (!senderId || !textBody) continue;

        // Fetch or create client for this Instagram user
        const igHandle = `@ig_user_${senderId.slice(-4)}`;
        let clientRows = await sql`
          SELECT id FROM client
          WHERE phone = ${'ig:' + senderId} OR email = ${'ig:' + senderId}
          LIMIT 1
        `;

        let clientId = clientRows[0]?.id;
        if (!clientId) {
          const newClient = await sql`
            INSERT INTO client (id, name, phone, created_at, updated_at)
            VALUES (gen_random_uuid(), ${igHandle}, ${'ig:' + senderId}, NOW(), NOW())
            RETURNING id
          `;
          clientId = newClient[0].id;
        }

        // Find or create Instagram conversation
        let convRows = await sql`
          SELECT id FROM conversation
          WHERE client_id = ${clientId} AND channel = 'instagram'
          LIMIT 1
        `;

        let convId = convRows[0]?.id;
        if (!convId) {
          const newConv = await sql`
            INSERT INTO conversation (id, client_id, channel, state, created_at, updated_at)
            VALUES (gen_random_uuid(), ${clientId}, 'instagram', 'ai', NOW(), NOW())
            RETURNING id
          `;
          convId = newConv[0].id;
        }

        // Insert message
        await sql`
          INSERT INTO message (
            id, conversation_id, direction, body, sent_by, status, created_at, updated_at
          )
          VALUES (
            gen_random_uuid(), ${convId}, 'inbound', ${textBody}, ${igHandle}, 'delivered', NOW(), NOW()
          )
        `;

        // Update conversation timestamp
        await sql`
          UPDATE conversation
          SET updated_at = NOW()
          WHERE id = ${convId}
        `;

        const triage = triageInboundMessage(textBody);
        console.log(`[Instagram Webhook] Ingested message from ${igHandle} to conv ${convId}. AI triage: ${triage.label}`);
      }
    }

    return NextResponse.json({ status: "processed" });
  } catch (error: any) {
    console.error("[Instagram Webhook Error]", error);
    return NextResponse.json({ error: error.message || "Internal processing error" }, { status: 500 });
  }
}
