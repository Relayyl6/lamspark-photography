import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    // 1. Check settings for rich testimonials
    const settingsRow = await sql.query(
      `SELECT value FROM settings WHERE key = 'site_testimonials' LIMIT 1`
    ).catch(() => []);

    if (settingsRow.length > 0 && Array.isArray(settingsRow[0].value) && settingsRow[0].value.length > 0) {
      return NextResponse.json({
        success: true,
        source: "neon_settings",
        testimonials: settingsRow[0].value,
      });
    }

    // 2. Fallback to testimonial table
    const tableRows = await sql.query(
      `SELECT id, first_name, session_type, quote, context, active FROM testimonial WHERE active = true ORDER BY created_at DESC`
    ).catch(() => []);

    const mapped = tableRows.map((t: any, idx: number) => ({
      id: t.id,
      index: String(idx + 1).padStart(2, "0"),
      clientName: t.first_name,
      roleOrLocation: t.context || `${t.session_type} Session · Abuja`,
      headline: "Exquisite Craftsmanship & Dignity",
      quote: t.quote,
      avatarUrl: "/images/client/events_2.jpg",
      active: t.active,
    }));

    return NextResponse.json({
      success: true,
      source: "neon_table",
      testimonials: mapped,
    });
  } catch (err: any) {
    console.error("[testimonials GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
