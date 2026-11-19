import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";
import { triageInboundMessage, classifyInboundMessageWithMultiAI } from "@/lib/ai/service";
import { sendWhatsAppMessage } from "@/lib/integrations/whatsapp/baileys";
import { sendInstagramMessage } from "@/lib/integrations/instagram/client";

const sql = neon(process.env.DATABASE_URL!);

// GET: fetch active client conversations with messages
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawConvs = await sql.query(`
      SELECT 
        cv.id,
        cv.client_id,
        cv.state,
        cv.channel,
        cv.host_account,
        cv.last_inbound_at,
        cv.taken_over_by,
        c.name as client_name,
        c.whatsapp_e164 as whatsapp,
        c.email as client_email,
        (
          SELECT json_agg(m ORDER BY m.created_at ASC)
          FROM (
            SELECT id, direction, body, sent_by, ai_label, ai_draft, category, is_business, status, created_at
            FROM message
            WHERE conversation_id = cv.id
            ORDER BY created_at ASC
          ) m
        ) as messages
      FROM conversation cv
      JOIN client c ON cv.client_id = c.id
      ORDER BY cv.updated_at DESC
    `);

    const conversations = rawConvs.map((cv: any) => ({
      id: cv.id,
      clientId: cv.client_id,
      clientName: cv.client_name,
      whatsapp: cv.whatsapp,
      channel: cv.channel || "WhatsApp",
      hostAccount: cv.host_account || null,
      state: cv.state || "bot",
      takenOverBy: cv.taken_over_by,
      lastInboundAt: cv.last_inbound_at,
      messages: cv.messages || [],
    }));

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error("[inbox GET error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: send reply message to client OR simulate inbound messages
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    // 1. Simulation Handler: allows Studio Owner to test WhatsApp & Instagram DM ingestion
    if (body.action === "simulate_inbound") {
      const {
        channel = "whatsapp",
        sender_name,
        sender_phone,
        message,
        intent_tag,
      } = body;

      if (!sender_name || !message?.trim()) {
        return NextResponse.json({ error: "sender_name and message are required" }, { status: 400 });
      }

      // Normalize identifier
      const cleanPhone = sender_phone?.trim() || `sim-${Date.now()}`;

      // Find or create client
      const client = await sql.query(
        `SELECT id, name, whatsapp_e164 FROM client WHERE whatsapp_e164 = $1 OR name = $2 LIMIT 1`,
        [cleanPhone, sender_name.trim()]
      );

      let clientId: string;
      if (client.length > 0) {
        clientId = client[0].id;
      } else {
        const newClient = await sql.query(
          `INSERT INTO client (
            id, name, whatsapp_e164, instagram_handle, source_first, messaging_consent, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW()
          ) RETURNING id`,
          [
            sender_name.trim(),
            cleanPhone,
            channel === "instagram" ? sender_phone.replace("@", "") : null,
            channel,
          ]
        );
        clientId = newClient[0].id;
      }

      // Find or create conversation
      const conv = await sql.query(
        `SELECT id, state FROM conversation WHERE client_id = $1 AND channel = $2 LIMIT 1`,
        [clientId, channel]
      );

      let convId: string;
      if (conv.length > 0) {
        convId = conv[0].id;
      } else {
        const newConv = await sql.query(
          `INSERT INTO conversation (
            id, client_id, channel, state, last_inbound_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, 'bot', NOW(), NOW(), NOW()
          ) RETURNING id`,
          [clientId, channel]
        );
        convId = newConv[0].id;
      }

      // Multi-Model AI Consensus Triage
      let label = intent_tag;
      let draft = "";
      let category = "business";
      let isBusiness = true;
      try {
        const triage = await classifyInboundMessageWithMultiAI(message.trim());
        if (triage) {
          label = label || triage.label;
          draft = triage.suggestedAction || "";
          category = triage.category;
          isBusiness = triage.isBusiness;
        }
      } catch {
        label = label || "session_inquiry";
      }

      // Insert inbound message
      const inserted = await sql.query(
        `INSERT INTO message (
          id, conversation_id, direction, body, status, ai_label, ai_draft, category, is_business, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, 'inbound', $2, 'delivered', $3, $4, $5, $6, NOW(), NOW()
        ) RETURNING *`,
        [convId, message.trim(), label, draft, category, isBusiness]
      );

      // Update conversation timestamp
      await sql.query(
        `UPDATE conversation SET last_inbound_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [convId]
      );

      return NextResponse.json({
        success: true,
        action: "simulated_inbound",
        conversation: { id: convId, clientName: sender_name, channel },
        message: inserted[0],
      });
    }

    // 2. Normal Outbound Reply Dispatch
    const { conversationId, text, channel = "whatsapp" } = body;

    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });
    }

    // Save outbound message to DB
    const inserted = await sql.query(
      `INSERT INTO message (
        id, conversation_id, direction, body, sent_by, status, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, 'outbound', $2, $3, 'sent', NOW(), NOW()
      )
      RETURNING *`,
      [conversationId, text.trim(), admin.name]
    );

    // Update conversation timestamp & set to human takeover
    await sql.query(
      `UPDATE conversation
       SET state = 'human', updated_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );

    // Dispatch Outbound Message:
    // 1. WhatsApp Dispatch (Baileys Web Client first, then Meta Cloud API fallback)
    const clientRow = await sql.query(
      `SELECT c.whatsapp_e164, c.instagram_handle, conv.channel FROM client c
       JOIN conversation conv ON conv.client_id = c.id
       WHERE conv.id = $1`,
      [conversationId]
    );

    const convChannel = clientRow[0]?.channel?.toLowerCase() || channel.toLowerCase();
    const recipientPhone = clientRow[0]?.whatsapp_e164;
    const igHandle = clientRow[0]?.instagram_handle;

    if (convChannel === "whatsapp" && recipientPhone) {
      let dispatched = false;
      try {
        await sendWhatsAppMessage(recipientPhone, text.trim());
        dispatched = true;
        console.log(`[WhatsApp Outbound Dispatched via Baileys Web to ${recipientPhone}]`);
      } catch (baileysErr: any) {
        console.warn("[Baileys Dispatch Notice]", baileysErr.message);
      }

      // Fallback to Meta Cloud API if configured
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (!dispatched && token && phoneId) {
        try {
          const cleanRecipient = recipientPhone.replace(/[^0-9]/g, "");
          await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanRecipient,
              type: "text",
              text: { body: text.trim() },
            }),
          });
        } catch (waErr) {
          console.warn("[Meta WhatsApp Cloud API Fallback Notice]", waErr);
        }
      }
    }

    // 2. Instagram Dispatch (Instagram Direct Client first, then Meta Graph API fallback)
    if (convChannel === "instagram") {
      let dispatched = false;
      const targetUser = igHandle || recipientPhone?.replace("@", "");
      if (targetUser) {
        try {
          await sendInstagramMessage(targetUser, text.trim());
          dispatched = true;
          console.log(`[Instagram Outbound Dispatched directly to @${targetUser}]`);
        } catch (igDirectErr: any) {
          console.warn("[Instagram Direct Dispatch Notice]", igDirectErr.message);
        }
      }

      const igToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
      if (!dispatched && igToken && targetUser?.startsWith("ig:")) {
        try {
          const igUserId = targetUser.replace("ig:", "");
          await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${igToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipient: { id: igUserId },
              message: { text: text.trim() },
            }),
          });
        } catch (igErr) {
          console.warn("[Meta Instagram Fallback Notice]", igErr);
        }
      }
    }

    return NextResponse.json({ success: true, message: inserted[0] });
  } catch (err: any) {
    console.error("[inbox POST error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: toggle human takeover / AI mode
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { conversationId, state } = body;

    if (!conversationId || !state) {
      return NextResponse.json({ error: "conversationId and state are required" }, { status: 400 });
    }

    await sql.query(
      `UPDATE conversation
       SET state = $1, taken_over_by = $2, updated_at = NOW()
       WHERE id = $3`,
      [state, state === "human" ? admin.name : null, conversationId]
    );

    return NextResponse.json({ success: true, state });
  } catch (err: any) {
    console.error("[inbox PUT error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
