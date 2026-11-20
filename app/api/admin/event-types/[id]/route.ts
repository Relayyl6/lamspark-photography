import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

// PUT: update an event type
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;
    const body = await req.json();
    const { name, slug, description, badgeColor, displayOrder } = body;

    const sql = neon(process.env.DATABASE_URL!);

    // Check old record
    const existing = await sql.query(`SELECT slug FROM event_type WHERE id = $1`, [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }
    const oldSlug = existing[0].slug;

    let cleanSlug = slug
      ? slug
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : oldSlug;

    const result = await sql.query(
      `UPDATE event_type
       SET
         name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         badge_color = COALESCE($4, badge_color),
         display_order = COALESCE($5, display_order),
         updated_at = NOW()
       WHERE id = $6
       RETURNING 
         id,
         slug,
         name,
         description,
         badge_color as "badgeColor",
         display_order as "displayOrder"`,
      [
        name ?? null,
        cleanSlug,
        description ?? null,
        badgeColor ?? null,
        displayOrder ?? null,
        id,
      ]
    );

    // If slug changed, cascade update to galleries with the old slug
    if (cleanSlug && cleanSlug !== oldSlug) {
      await sql.query(`UPDATE gallery SET session_type = $1 WHERE session_type = $2`, [
        cleanSlug,
        oldSlug,
      ]);
      await sql.query(`UPDATE asset SET session_type = $1 WHERE session_type = $2`, [
        cleanSlug,
        oldSlug,
      ]);
    }

    return NextResponse.json({ success: true, eventType: result[0] });
  } catch (err: any) {
    console.error("[event-types PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: delete an event type
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;
    const sql = neon(process.env.DATABASE_URL!);

    // Fetch slug before deleting
    const existing = await sql.query(`SELECT slug FROM event_type WHERE id = $1`, [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }
    const slugToDelete = existing[0].slug;

    // Delete event type
    await sql.query(`DELETE FROM event_type WHERE id = $1`, [id]);

    // Unlink any galleries that had this session_type so they aren't orphaned
    await sql.query(
      `UPDATE gallery SET session_type = 'general' WHERE session_type = $1`,
      [slugToDelete]
    );

    return NextResponse.json({ success: true, deletedSlug: slugToDelete });
  } catch (err: any) {
    console.error("[event-types DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
