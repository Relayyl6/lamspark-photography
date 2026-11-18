import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

// GET: return all site content & settings
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settingsRows = await sql.query(`SELECT key, value, updated_at FROM settings ORDER BY key`).catch(() => []);
    const contentRows = await sql.query(`SELECT key, value, updated_at FROM site_content ORDER BY key`).catch(() => []);

    const content: Record<string, any> = {};
    for (const row of contentRows) {
      content[row.key] = row.value;
    }
    for (const row of settingsRows) {
      content[row.key] = row.value;
    }

    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("[content GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: update content blob or complex setting by key
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    // 1. Always save into settings as JSONB
    const jsonStr = JSON.stringify(value);
    await sql.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [key, jsonStr]
    );

    // 2. If it's a string, also save into site_content
    if (typeof value === "string") {
      await sql.query(
        `INSERT INTO site_content (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           updated_at = NOW()`,
        [key, value]
      );
    }

    return NextResponse.json({ success: true, key, value });
  } catch (err: any) {
    console.error("[content PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
