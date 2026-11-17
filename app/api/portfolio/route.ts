import { NextResponse } from "next/server";
import { db } from "@/db";
import { galleries, galleryItems, assets } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get("category");

    // Query Neon database for galleries
    const allGalleries = await db
      .select()
      .from(galleries)
      .orderBy(asc(galleries.displayOrder));

    // For each gallery, fetch its associated items and assets from Neon
    const result = await Promise.all(
      allGalleries.map(async (gal) => {
        const items = await db
          .select({
            id: galleryItems.id,
            caption: galleryItems.caption,
            displayOrder: galleryItems.displayOrder,
            assetId: assets.id,
            storageKey: assets.storageKey,
            sessionType: assets.sessionType,
            altText: assets.altText,
          })
          .from(galleryItems)
          .innerJoin(assets, eq(galleryItems.assetId, assets.id))
          .where(eq(galleryItems.galleryId, gal.id))
          .orderBy(asc(galleryItems.displayOrder));

        return {
          id: gal.id,
          slug: gal.slug,
          title: gal.title,
          description: gal.description,
          sessionType: gal.sessionType,
          displayOrder: gal.displayOrder,
          coverAssetId: gal.coverAssetId,
          items: items.map((item) => ({
            id: item.id,
            src: item.storageKey,
            alt: item.altText || gal.title,
            caption: item.caption,
            sessionType: item.sessionType,
            category: gal.title,
            slug: gal.slug,
          })),
        };
      })
    );

    // If category specified, filter galleries
    const filtered = categoryFilter && categoryFilter !== "All"
      ? result.filter((g) => g.slug === categoryFilter.toLowerCase() || g.title.toLowerCase().includes(categoryFilter.toLowerCase()))
      : result;

    return NextResponse.json({
      success: true,
      source: "neon_database",
      galleries: filtered,
      totalGalleries: filtered.length,
      totalPhotos: filtered.reduce((acc, g) => acc + g.items.length, 0),
    });
  } catch (error) {
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
