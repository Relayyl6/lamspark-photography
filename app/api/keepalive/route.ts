import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "lamsparks-build-suite",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
}
