import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { SESSION_TYPES, PACKAGES } from "@/lib/catalog/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const overrides = await sql.query(`SELECT * FROM session_override`).catch(() => []);
    const map = new Map(overrides.map((o: any) => [o.slug, o]));

    const sessions = Object.values(SESSION_TYPES).map((st) => {
      const ov: any = map.get(st.slug);
      let tierLowestPrice: number | null = null;
      if (Array.isArray(ov?.package_tiers) && ov.package_tiers.length > 0) {
        const tierPrices = ov.package_tiers
          .map((t: any) => (t.promoPrice ? Number(t.promoPrice) : Number(t.price)))
          .filter((p: number) => !isNaN(p) && p > 0);
        if (tierPrices.length > 0) {
          tierLowestPrice = Math.min(...tierPrices);
        }
      }

      const effectiveFrom = ov?.price_override ?? tierLowestPrice ?? st.fromPrice;

      return {
        ...st,
        heroImage: ov?.cover_image_url || st.heroImage,
        fromPrice: effectiveFrom,
        promoPrice: ov?.promo_price ?? null,
        depositPercent: ov?.deposit_percent ?? st.defaultDepositPercent,
        defaultDepositPercent: ov?.deposit_percent ?? st.defaultDepositPercent,
        standardDeliveryDays: ov?.delivery_days || st.standardDeliveryDays,
      };
    });

    // Merge live packages from package_tiers
    let livePackages = [...PACKAGES];
    for (const ov of overrides) {
      if (Array.isArray(ov.package_tiers) && ov.package_tiers.length > 0) {
        // Replace packages for this session type
        livePackages = livePackages.filter((p) => p.sessionType !== ov.slug);
        livePackages.push(
          ...ov.package_tiers.map((t: any) => ({
            id: t.id || `${ov.slug}-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
            sessionType: ov.slug,
            name: t.name,
            price: t.promoPrice ? t.promoPrice : t.price,
            originalPrice: t.promoPrice ? t.price : null,
            badge: t.badge || undefined,
            sort: t.sort || 1,
            deliveryDaysText: t.deliveryDaysText || "7 to 10 working days",
            inclusions: Array.isArray(t.inclusions) ? t.inclusions : [],
          }))
        );
      }
    }

    return NextResponse.json({ sessions, packages: livePackages });
  } catch (err) {
    return NextResponse.json({ sessions: Object.values(SESSION_TYPES), packages: PACKAGES });
  }
}
