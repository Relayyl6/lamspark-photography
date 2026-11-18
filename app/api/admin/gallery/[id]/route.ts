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
    const { title, description, coverImage, sessionType, displayOrder } = body;

    const result = await sql.query(
      `UPDATE gallery
       SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         cover_asset_id = COALESCE($3, cover_asset_id),
         session_type = COALESCE($4, session_type),
         display_order = COALESCE($5, display_order),
         updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        title ?? null,
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
