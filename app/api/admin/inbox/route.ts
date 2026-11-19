import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";
import { triageInboundMessage } from "@/lib/ai/service";

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
        cv.last_inbound_at,
        cv.taken_over_by,
        c.name as client_name,
        c.whatsapp_e164 as whatsapp,
        c.email as client_email,
        (
          SELECT json_agg(m ORDER BY m.created_at ASC)
          FROM (
            SELECT id, direction, body, sent_by, ai_label, ai_draft, status, created_at
            FROM message
            WHERE conversation_id = cv.id
            ORDER BY created_at ASC
          ) m
        ) as messages
      FROM conversation cv
      JOIN client c ON cv.client_id = c.id
      ORDER BY cv.updated_at DESC
    `);

    // If none seeded yet, return initial studio conversations
    if (rawConvs.length === 0) {
      const defaultConversations = [
        {
          id: "conv-1",
          clientId: "c-101",
          clientName: "Hadiza Mohammed",
          whatsapp: "+234 803 123 4567",
          channel: "WhatsApp",
          state: "bot",
          lastInboundAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          messages: [
            {
              id: "m-1",
              direction: "inbound",
              body: "Good morning! Can we bring three outfits for our twin girls' 1st birthday shoot in Maitama?",
              created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
              ai_label: "Wardrobe & Pacing Inquiry",
              ai_draft: "Hello Hadiza! Absolutely, your Luxury collection comfortably accommodates 3 to 4 outfit changes for both girls with calm breaks.",
            },
          ],
        },
        {
          id: "conv-2",
          clientId: "c-102",
          clientName: "Dr. David O.",
          whatsapp: "+234 812 987 6543",
          channel: "WhatsApp",
          state: "human",
          lastInboundAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
          messages: [
            {
              id: "m-2",
              direction: "inbound",
              body: "I need to reschedule our executive headshots from Thursday to Friday afternoon if possible.",
              created_at: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
              ai_label: "Reschedule Request",
              ai_draft: "Hello Dr. David! We have Friday at 2:30 PM open in our Maitama studio. Let us know if that works smoothly for your schedule.",
            },
          ],
        },
      ];
      return NextResponse.json({ conversations: defaultConversations });
    }

    const conversations = rawConvs.map((cv: any) => ({
      id: cv.id,
      clientId: cv.client_id,
      clientName: cv.client_name,
      whatsapp: cv.whatsapp,
      channel: cv.channel || "WhatsApp",
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

// POST: send reply message to client
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
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

    // Update conversation timestamp
    await sql.query(
      `UPDATE conversation
       SET state = 'human', updated_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );

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
