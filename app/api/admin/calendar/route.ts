import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET: fetch scheduled content items
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await sql.query(`
      SELECT * FROM content_item
      ORDER BY created_at DESC
    `);

    // If none seeded yet, return initial studio targets
    if (items.length === 0) {
      const defaultItems = [
        {
          id: "c-1",
          platforms: ["Instagram", "WhatsApp Status"],
          format: "Carousel",
          pillar: "Craft & Light",
          purpose: "Behind the scenes of our unhurried toddler pacing in the Maitama studio",
          status: "Scheduled",
          publish_at_by_platform: { Instagram: "Next Monday 10:00 AM", WhatsApp: "Next Monday 10:00 AM" },
          caption_by_platform: { Instagram: "We don't ask children to perform. We let them explore, laugh, and pause. Unhurried toddler portraits in Abuja." },
          created_at: new Date().toISOString(),
        },
        {
          id: "c-2",
          platforms: ["LinkedIn", "Instagram"],
          format: "Editorial Image",
          pillar: "Executive Presence",
          purpose: "Why executive portraits in Abuja require gentle, architectural lighting",
          status: "Drafting",
          publish_at_by_platform: { LinkedIn: "Thursday 12:00 PM" },
          caption_by_platform: { LinkedIn: "Executive gravitas is not rigid. It is quiet calm, confident poise, and tailored presence." },
          created_at: new Date().toISOString(),
        },
        {
          id: "c-3",
          platforms: ["TikTok", "Instagram"],
          format: "Short Reel",
          pillar: "Purity & Pacing",
          purpose: "Lighting setup for luxury maternity portraits in Maitama",
          status: "Published",
          publish_at_by_platform: { TikTok: "Yesterday 4:00 PM" },
          caption_by_platform: { TikTok: "Sculpting gentle shadows for expectant mothers." },
          created_at: new Date().toISOString(),
        },
      ];
      return NextResponse.json({ items: defaultItems });
    }

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("[calendar GET error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: schedule new content item
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { platform, format, pillar, topic, scheduledDate, caption } = body;

    if (!topic || !pillar) {
      return NextResponse.json({ error: "Topic and pillar are required" }, { status: 400 });
    }

    const inserted = await sql.query(
      `INSERT INTO content_item (
        id, platforms, format, pillar, purpose, status, 
        publish_at_by_platform, caption_by_platform, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'Scheduled',
        $5, $6, NOW(), NOW()
      )
      RETURNING *`,
      [
        JSON.stringify([platform || "Instagram"]),
        format || "Carousel",
        pillar,
        topic,
        JSON.stringify({ [platform || "Instagram"]: scheduledDate || "Scheduled" }),
        JSON.stringify({ [platform || "Instagram"]: caption || topic }),
      ]
    );

    return NextResponse.json({ success: true, item: inserted[0] }, { status: 201 });
  } catch (err: any) {
    console.error("[calendar POST error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
