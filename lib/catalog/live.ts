import { neon } from "@neondatabase/serverless";
import { SESSION_TYPES, PACKAGES, SessionTypeMeta } from "@/lib/catalog/seed";
import type { SessionTypeSlug, PackageItem } from "@/lib/types";

export async function getLiveSessionTypes(): Promise<Record<SessionTypeSlug, SessionTypeMeta>> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return SESSION_TYPES;

    const sql = neon(dbUrl);
    const overrides = await sql.query(`SELECT * FROM session_override`).catch(() => []);
    const map = new Map(overrides.map((o: any) => [o.slug, o]));

    const result: any = {};
    for (const [key, st] of Object.entries(SESSION_TYPES)) {
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

      result[key] = {
        ...st,
        heroImage: ov?.cover_image_url || st.heroImage,
        fromPrice: effectiveFrom,
        promoPrice: ov?.promo_price ?? null,
        depositPercent: ov?.deposit_percent ?? st.defaultDepositPercent,
        defaultDepositPercent: ov?.deposit_percent ?? st.defaultDepositPercent,
        standardDeliveryDays: ov?.delivery_days || st.standardDeliveryDays,
      };
    }
    return result as Record<SessionTypeSlug, SessionTypeMeta>;
  } catch {
    return SESSION_TYPES;
  }
}

export async function getLivePackages(sessionSlug?: string): Promise<PackageItem[]> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return sessionSlug ? PACKAGES.filter((p) => p.sessionType === sessionSlug) : PACKAGES;
    }

    const sql = neon(dbUrl);
    const query = sessionSlug
      ? `SELECT slug, package_tiers FROM session_override WHERE slug = '${sessionSlug.replace(/[^a-z0-9_-]/g, "")}'`
      : `SELECT slug, package_tiers FROM session_override`;
    
    const rows = await sql.query(query).catch(() => []);
    
    let livePackages: PackageItem[] = [];
    for (const row of rows) {
      if (Array.isArray(row.package_tiers) && row.package_tiers.length > 0) {
        livePackages.push(
          ...row.package_tiers.map((t: any) => ({
            id: t.id || `${row.slug}-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
            sessionType: row.slug as SessionTypeSlug,
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

    if (livePackages.length > 0) {
      return livePackages;
    }

    return sessionSlug ? PACKAGES.filter((p) => p.sessionType === sessionSlug) : PACKAGES;
  } catch {
    return sessionSlug ? PACKAGES.filter((p) => p.sessionType === sessionSlug) : PACKAGES;
  }
}
