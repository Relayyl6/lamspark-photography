import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// PUT: update asset
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;
    const body = await req.json();
    const { altText, sessionType, galleryId, consentStatus, altTextApproved } = body;

    const result = await sql.query(
      `UPDATE asset
       SET
         alt_text = COALESCE($1, alt_text),
         session_type = COALESCE($2, session_type),
         consent_status = COALESCE($3, consent_status),
         alt_text_approved = COALESCE($4, alt_text_approved),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        altText ?? null,
        sessionType ?? null,
        consentStatus ?? null,
        altTextApproved ?? null,
        id,
      ]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // If galleryId provided, upsert gallery_item link
    if (galleryId !== undefined) {
      if (galleryId) {
        const existing = await sql.query(
          `SELECT id FROM gallery_item WHERE asset_id = $1 AND gallery_id = $2`,
          [id, galleryId]
        );
        if (existing.length === 0) {
          const maxOrderResult = await sql.query(
            `SELECT COALESCE(MAX(display_order), 0) as max_order FROM gallery_item WHERE gallery_id = $1`,
            [galleryId]
          );
          const nextOrder = (maxOrderResult[0]?.max_order ?? 0) + 1;
          await sql.query(
            `INSERT INTO gallery_item (id, gallery_id, asset_id, display_order, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
            [galleryId, id, nextOrder]
          );
        }
      } else {
        // galleryId = null means unlink from all galleries
        await sql.query(`DELETE FROM gallery_item WHERE asset_id = $1`, [id]);
      }
    }

    return NextResponse.json({ asset: result[0] });
  } catch (err: any) {
    console.error("[assets PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: delete asset from DB
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;

    // Remove from gallery_item first
    await sql.query(`DELETE FROM gallery_item WHERE asset_id = $1`, [id]);
    const result = await sql.query(`DELETE FROM asset WHERE id = $1 RETURNING id, storage_key`, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, id, storageKey: result[0].storage_key });
  } catch (err: any) {
    console.error("[assets DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
