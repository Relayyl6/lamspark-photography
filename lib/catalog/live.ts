import { neon } from "@neondatabase/serverless";
import { SESSION_TYPES, SessionTypeMeta } from "@/lib/catalog/seed";
import type { SessionTypeSlug } from "@/lib/types";

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
      result[key] = {
        ...st,
        heroImage: ov?.cover_image_url || st.heroImage,
        fromPrice: ov?.price_override ?? st.fromPrice,
        standardDeliveryDays: ov?.delivery_days || st.standardDeliveryDays,
      };
    }
    return result as Record<SessionTypeSlug, SessionTypeMeta>;
  } catch {
    return SESSION_TYPES;
  }
}
