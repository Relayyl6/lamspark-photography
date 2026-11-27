import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { loadBookingEmailContext } from "@/lib/email/mailer";
import { buildPrintableDocumentPage } from "@/lib/email/documents";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const type = searchParams.get("type") === "receipt" ? "receipt" : "invoice";

    if (!ref) {
      return NextResponse.json({ error: "Reference code (ref) is required." }, { status: 400 });
    }

    const ctx = await loadBookingEmailContext(sql, { referenceCode: ref });
    if (!ctx) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const html = buildPrintableDocumentPage(ctx, type);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[booking document GET error]", err);
    return NextResponse.json({ error: err.message || "Failed to generate document" }, { status: 500 });
  }
}
