import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// PUT: update gallery
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;
    const body = await req.json();
    const { title, slug, description, coverImage, sessionType, displayOrder, cascadeToAssets } = body;

    const result = await sql.query(
      `UPDATE gallery
       SET
         title = COALESCE($1, title),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         cover_asset_id = COALESCE($4, cover_asset_id),
         session_type = COALESCE($5, session_type),
         display_order = COALESCE($6, display_order),
         updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        title ?? null,
        slug ?? null,
        description ?? null,
        coverImage ?? null,
        sessionType ?? null,
        displayOrder ?? null,
        id,
      ]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    // Cascade session_type to all assets in this gallery if requested or if sessionType changed
    if (sessionType) {
      await sql.query(
        `UPDATE asset
         SET session_type = $1, updated_at = NOW()
         WHERE id IN (SELECT asset_id FROM gallery_item WHERE gallery_id = $2)`,
        [sessionType, id]
      );
    }

    return NextResponse.json({ gallery: result[0] });
  } catch (err: any) {
    console.error("[gallery PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: delete gallery and all its items
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;

    // Delete gallery items first (cascade)
    await sql.query(`DELETE FROM gallery_item WHERE gallery_id = $1`, [id]);
    const result = await sql.query(`DELETE FROM gallery WHERE id = $1 RETURNING id`, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (err: any) {
    console.error("[gallery DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
