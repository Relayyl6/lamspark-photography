import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";
import { SESSION_TYPES, PACKAGES } from "@/lib/catalog/seed";

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
    const sessions = Object.values(SESSION_TYPES).map((st) => {
      const relatedPackages = PACKAGES.filter((p) => p.sessionType === st.slug);
      const ov = overrideMap[st.slug];

      return {
        ...st,
        priceOverride: ov?.price_override ?? null,
        promoPrice: ov?.promo_price ?? null,
        depositPercent: ov?.deposit_percent ?? st.defaultDepositPercent,
        coverImageUrl: ov?.cover_image_url ?? null,
        deliveryDaysOverride: ov?.delivery_days ?? null,
        descriptionOverride: ov?.description_override ?? null,
        packageTiers: ov?.package_tiers || relatedPackages,
        hasOverride: !!ov,
      };
    });

    return NextResponse.json({ sessions });
  } catch (err: any) {
    console.error("[sessions GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: update session override (starting rate, promo price, deposit %, delivery, cover, package tiers)
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      slug,
      priceOverride,
      promoPrice,
      depositPercent,
      coverImageUrl,
      deliveryDays,
      descriptionOverride,
      packageTiers,
    } = body;

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const result = await sql.query(
      `INSERT INTO session_override (
         slug, price_override, promo_price, deposit_percent,
         cover_image_url, delivery_days, description_override,
         package_tiers, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         price_override = EXCLUDED.price_override,
         promo_price = EXCLUDED.promo_price,
         deposit_percent = EXCLUDED.deposit_percent,
         cover_image_url = EXCLUDED.cover_image_url,
         delivery_days = EXCLUDED.delivery_days,
         description_override = EXCLUDED.description_override,
         package_tiers = EXCLUDED.package_tiers,
         updated_at = NOW()
       RETURNING *`,
      [
        slug,
        priceOverride ?? null,
        promoPrice ?? null,
        depositPercent ?? null,
        coverImageUrl ?? null,
        deliveryDays ?? null,
        descriptionOverride ?? null,
        packageTiers ? JSON.stringify(packageTiers) : null,
      ]
    );

    return NextResponse.json({ override: result[0] });
  } catch (err: any) {
    console.error("[sessions PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
