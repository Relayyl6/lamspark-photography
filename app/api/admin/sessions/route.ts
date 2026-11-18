import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";
import { SESSION_TYPES } from "@/lib/catalog/seed";

const sql = neon(process.env.DATABASE_URL!);

// GET: return all session types with DB overrides
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const overrides = await sql.query(`SELECT * FROM session_override`);
    const overrideMap: Record<string, any> = {};
    for (const row of overrides) {
      overrideMap[row.slug] = row;
    }

    // Merge catalog with DB overrides
    const sessions = Object.values(SESSION_TYPES).map((st) => ({
      ...st,
      priceOverride: overrideMap[st.slug]?.price_override ?? null,
      coverImageUrl: overrideMap[st.slug]?.cover_image_url ?? null,
      deliveryDaysOverride: overrideMap[st.slug]?.delivery_days ?? null,
      hasOverride: !!overrideMap[st.slug],
    }));

    return NextResponse.json({ sessions });
  } catch (err: any) {
    console.error("[sessions GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: update session override
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { slug, priceOverride, coverImageUrl, deliveryDays } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const result = await sql.query(
      `INSERT INTO session_override (slug, price_override, cover_image_url, delivery_days, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         price_override = EXCLUDED.price_override,
         cover_image_url = EXCLUDED.cover_image_url,
         delivery_days = EXCLUDED.delivery_days,
         updated_at = NOW()
       RETURNING *`,
      [slug, priceOverride ?? null, coverImageUrl ?? null, deliveryDays ?? null]
    );

    return NextResponse.json({ override: result[0] });
  } catch (err: any) {
    console.error("[sessions PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
