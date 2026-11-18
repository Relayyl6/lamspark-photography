import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET: list all galleries with item count
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const galleries = await sql.query(`
      SELECT 
        g.id,
        g.slug,
        g.title,
        g.description,
        g.session_type,
        g.cover_asset_id,
        g.display_order,
        g.created_at,
        g.updated_at,
        COUNT(gi.id)::int AS item_count
      FROM gallery g
      LEFT JOIN gallery_item gi ON gi.gallery_id = g.id
      GROUP BY g.id
      ORDER BY g.display_order ASC, g.created_at DESC
    `);

    return NextResponse.json({ galleries: galleries });
  } catch (err: any) {
    console.error("[gallery GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create new gallery
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, slug, coverImage, sessionType } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const result = await sql.query(
      `INSERT INTO gallery (id, slug, title, description, session_type, cover_asset_id, display_order, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 0, NOW(), NOW())
       RETURNING *`,
      [slug, name, description || null, sessionType || null, coverImage || null]
    );

    return NextResponse.json({ gallery: result[0] }, { status: 201 });
  } catch (err: any) {
    console.error("[gallery POST]", err);
    if (err.message?.includes("unique")) {
      return NextResponse.json({ error: "A gallery with that slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
