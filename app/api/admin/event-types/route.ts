import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

// GET: list all event types with gallery and photo counts
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const eventTypes = await sql.query(`
      SELECT 
        et.id,
        et.slug,
        et.name,
        et.description,
        et.badge_color as "badgeColor",
        et.display_order as "displayOrder",
        et.created_at as "createdAt",
        COUNT(DISTINCT g.id)::int as "galleryCount",
        COUNT(DISTINCT gi.id)::int as "photoCount"
      FROM event_type et
      LEFT JOIN gallery g ON g.session_type = et.slug
      LEFT JOIN gallery_item gi ON gi.gallery_id = g.id
      GROUP BY et.id, et.slug, et.name, et.description, et.badge_color, et.display_order, et.created_at
      ORDER BY et.display_order ASC, et.created_at ASC
    `);

    return NextResponse.json({ success: true, eventTypes });
  } catch (err: any) {
    console.error("[event-types GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create a new event type
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, description, badgeColor, displayOrder } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Auto-generate slug if not provided
    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql.query(
      `INSERT INTO event_type (id, slug, name, description, badge_color, display_order, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         badge_color = EXCLUDED.badge_color,
         display_order = EXCLUDED.display_order,
         updated_at = NOW()
       RETURNING 
         id,
         slug,
         name,
         description,
         badge_color as "badgeColor",
         display_order as "displayOrder"`,
      [
        cleanSlug,
        name.trim(),
        description?.trim() || null,
        badgeColor || "#C9A96E",
        displayOrder || 99,
      ]
    );

    return NextResponse.json({ success: true, eventType: result[0] }, { status: 201 });
  } catch (err: any) {
    console.error("[event-types POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
