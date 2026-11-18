import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedKey = searchParams.get("key");

    if (requestedKey) {
      // Query specific key from settings first
      const settingsRow = await sql.query(
        `SELECT key, value, updated_at FROM settings WHERE key = $1 LIMIT 1`,
        [requestedKey]
      ).catch(() => []);

      if (settingsRow.length > 0) {
        return NextResponse.json({ success: true, key: requestedKey, value: settingsRow[0].value });
      }

      // Fallback to site_content
      const contentRow = await sql.query(
        `SELECT key, value, updated_at FROM site_content WHERE key = $1 LIMIT 1`,
        [requestedKey]
      ).catch(() => []);

      if (contentRow.length > 0) {
        return NextResponse.json({ success: true, key: requestedKey, value: contentRow[0].value });
      }

      return NextResponse.json({ success: false, error: "Key not found", value: null }, { status: 404 });
    }

    // Return all keys
    const settingsRows = await sql.query(`SELECT key, value FROM settings ORDER BY key`).catch(() => []);
    const contentRows = await sql.query(`SELECT key, value FROM site_content ORDER BY key`).catch(() => []);

    const content: Record<string, any> = {};
    for (const row of contentRows) {
      content[row.key] = row.value;
    }
    for (const row of settingsRows) {
      content[row.key] = row.value;
    }

    return NextResponse.json({ success: true, content });
  } catch (err: any) {
    console.error("[public content GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
