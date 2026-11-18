import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { SESSION_TYPES } from "@/lib/catalog/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const overrides = await sql.query(`SELECT * FROM session_override`).catch(() => []);
    const map = new Map(overrides.map((o: any) => [o.slug, o]));

    const sessions = Object.values(SESSION_TYPES).map((st) => {
      const ov: any = map.get(st.slug);
      return {
        ...st,
        heroImage: ov?.cover_image_url || st.heroImage,
        fromPrice: ov?.price_override ?? st.fromPrice,
        standardDeliveryDays: ov?.delivery_days || st.standardDeliveryDays,
      };
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ sessions: Object.values(SESSION_TYPES) });
  }
}
