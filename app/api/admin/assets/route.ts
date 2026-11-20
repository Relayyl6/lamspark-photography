import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET: list assets with optional ?galleryId= filter
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const galleryId = searchParams.get("galleryId");

    let assets;
    if (galleryId) {
      assets = await sql.query(
        `SELECT a.*, gi.id as gallery_item_id, gi.caption, gi.display_order as gallery_order
         FROM asset a
         INNER JOIN gallery_item gi ON gi.asset_id = a.id
         WHERE gi.gallery_id = $1
         ORDER BY gi.display_order ASC, a.created_at DESC`,
        [galleryId]
      );
    } else {
      assets = await sql.query(
        `SELECT a.*
         FROM asset a
         ORDER BY a.created_at DESC
         LIMIT 200`
      );
    }

    return NextResponse.json({ assets });
  } catch (err: any) {
    console.error("[assets GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create asset record after Cloudinary upload
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      storageKey,
      storageBucket,
      kind,
      sessionType,
      altText,
      galleryId,
      consentStatus,
    } = body;

    if (!storageKey) {
      return NextResponse.json({ error: "storageKey is required" }, { status: 400 });
    }

    // Insert the asset
    const assetResult = await sql.query(
      `INSERT INTO asset (id, storage_key, storage_bucket, kind, session_type, alt_text, consent_status, colour_graded, alt_text_approved, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, false, false, NOW(), NOW())
       RETURNING *`,
      [
        storageKey,
        storageBucket || "portfolio-assets",
        kind || "photo",
        sessionType || null,
        altText || null,
        consentStatus || "none",
      ]
    );

    const asset = assetResult[0];

    // If a galleryId was provided, link it to gallery_item
    if (galleryId && asset) {
      const maxOrderResult = await sql.query(
        `SELECT COALESCE(MAX(display_order), 0) as max_order FROM gallery_item WHERE gallery_id = $1`,
        [galleryId]
      );
      const nextOrder = (maxOrderResult[0]?.max_order ?? 0) + 1;

      await sql.query(
        `INSERT INTO gallery_item (id, gallery_id, asset_id, caption, display_order, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
        [galleryId, asset.id, altText || null, nextOrder]
      );

      // Auto-set as gallery cover if not set yet
      await sql.query(
        `UPDATE gallery SET cover_asset_id = COALESCE(cover_asset_id, $1), updated_at = NOW() WHERE id = $2`,
        [asset.id, galleryId]
      );
    }

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err: any) {
    console.error("[assets POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
