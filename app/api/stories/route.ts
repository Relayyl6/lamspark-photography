import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    // 1. Check settings for rich stories
    const settingsRow = await sql.query(
      `SELECT value FROM settings WHERE key = 'site_stories' LIMIT 1`
    ).catch(() => []);

    if (settingsRow.length > 0 && Array.isArray(settingsRow[0].value) && settingsRow[0].value.length > 0) {
      return NextResponse.json({
        success: true,
        source: "neon_settings",
        stories: settingsRow[0].value,
      });
    }

    // 2. Fallback to story table
    const tableRows = await sql.query(
      `SELECT id, slug, title, session_type, client_name, body, featured_asset_id, published_at FROM story ORDER BY created_at DESC`
    ).catch(() => []);

    const mapped = tableRows.map((s: any, idx: number) => ({
      id: s.id,
      number: String(idx + 1).padStart(2, "0"),
      title: s.title,
      subtitle: "Unhurried Session Chronicle in Abuja",
      sessionType: s.session_type,
      sessionSlug: `/sessions#${s.session_type}`,
      client: s.client_name || "Private Family",
      date: s.published_at ? new Date(s.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recent Archive",
      location: "Private Studio Suite, Maitama, Abuja",
      lightDetails: "Sculpted natural light and archival exposure",
      excerpt: s.body.slice(0, 200) + "...",
      quote: "Giving quiet moments the reverence they deserve.",
      quoteAuthor: s.client_name || "Osemene",
      studioMood: "Warm, unhurried, serene",
      craft: {
        lens: "50mm f/1.2 L Prime",
        lighting: "Diffused North Skylight",
        pacing: "Unhurried pauses and quiet reflection",
        keepsake: "Museum-grade Italian Leather Album",
      },
      image: s.featured_asset_id || "/images/client/events_1.jpg",
      imageAlt: s.title,
      vintageSign: `Abuja Studio Suite · Archive No. ${String(idx + 1).padStart(4, "0")}`,
    }));

    return NextResponse.json({
      success: true,
      source: "neon_table",
      stories: mapped,
    });
  } catch (err: any) {
    console.error("[stories GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
