import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get("category");

    const sql = neon(process.env.DATABASE_URL!);

    // Single unified query to avoid N+1 network round trips
    const rows = await sql.query(
      `SELECT 
         g.id as "galleryId",
         g.slug as "gallerySlug",
         g.title as "galleryTitle",
         g.description as "galleryDescription",
         g.session_type as "gallerySessionType",
         g.display_order as "galleryDisplayOrder",
         g.cover_asset_id as "coverAssetId",
         gi.id as "itemId",
         gi.caption as "caption",
         gi.display_order as "itemDisplayOrder",
         a.id as "assetId",
         a.storage_key as "storageKey",
         a.session_type as "sessionType",
         a.alt_text as "altText"
       FROM gallery g
       LEFT JOIN gallery_item gi ON gi.gallery_id = g.id
       LEFT JOIN asset a ON gi.asset_id = a.id
       ORDER BY g.display_order ASC, gi.display_order ASC`
    );

    // Group rows by gallery
    const galleryMap = new Map<string, any>();

    for (const r of rows) {
      if (!galleryMap.has(r.galleryId)) {
        galleryMap.set(r.galleryId, {
          id: r.galleryId,
          slug: r.gallerySlug,
          title: r.galleryTitle,
          description: r.galleryDescription,
          sessionType: r.gallerySessionType,
          displayOrder: r.galleryDisplayOrder,
          coverAssetId: r.coverAssetId,
          items: [],
        });
      }

      if (r.itemId && r.storageKey) {
        const gal = galleryMap.get(r.galleryId);
        gal.items.push({
          id: r.itemId,
          src: r.storageKey,
          alt: r.altText || gal.title,
          caption: r.caption || gal.title,
          sessionType: r.sessionType || gal.sessionType,
          category: gal.title,
          slug: gal.slug,
        });
      }
    }

    const result = Array.from(galleryMap.values());

    // If category specified, filter galleries
    const filtered =
      categoryFilter && categoryFilter !== "All"
        ? result.filter(
            (g) =>
              g.slug.toLowerCase() === categoryFilter.toLowerCase() ||
              g.title.toLowerCase().includes(categoryFilter.toLowerCase())
          )
        : result;

    return NextResponse.json({
      success: true,
      source: "neon_database",
      galleries: filtered,
      totalGalleries: filtered.length,
      totalPhotos: filtered.reduce((acc, g) => acc + g.items.length, 0),
    });
  } catch (error: any) {
    console.error("Failed to fetch portfolio from Neon database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database query failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

