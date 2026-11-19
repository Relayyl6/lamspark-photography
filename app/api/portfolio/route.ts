import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get("category");

    const sql = neon(process.env.DATABASE_URL!);

    // Query all galleries from Neon DB
    const allGalleries = await sql.query(
      `SELECT id, slug, title, description, session_type, display_order, cover_asset_id
       FROM gallery
       ORDER BY display_order ASC`
    );

    // Fetch items with joined assets
    const result = await Promise.all(
      allGalleries.map(async (gal: any) => {
        const items = await sql.query(
          `SELECT 
             gi.id,
             gi.caption,
             gi.display_order as "displayOrder",
             a.id as "assetId",
             a.storage_key as "storageKey",
             a.session_type as "sessionType",
             a.alt_text as "altText"
           FROM gallery_item gi
           JOIN asset a ON gi.asset_id = a.id
           WHERE gi.gallery_id = $1
           ORDER BY gi.display_order ASC`,
          [gal.id]
        );

        return {
          id: gal.id,
          slug: gal.slug,
          title: gal.title,
          description: gal.description,
          sessionType: gal.session_type,
          displayOrder: gal.display_order,
          coverAssetId: gal.cover_asset_id,
          items: items.map((item: any) => ({
            id: item.id,
            src: item.storageKey,
            alt: item.altText || gal.title,
            caption: item.caption || gal.title,
            sessionType: item.sessionType,
            category: gal.title,
            slug: gal.slug,
          })),
        };
      })
    );

    // If category specified, filter galleries
    const filtered =
      categoryFilter && categoryFilter !== "All"
        ? result.filter(
            (g) =>
              g.slug === categoryFilter.toLowerCase() ||
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
