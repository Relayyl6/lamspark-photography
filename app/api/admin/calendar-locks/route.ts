import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql.query(
      `SELECT value FROM settings WHERE key = 'studio_calendar_locks'`
    ).catch(() => []);

    let data = {
      lockedSlots: [],
      blockedDays: [],
    };

    if (rows.length > 0 && rows[0].value) {
      const val = rows[0].value;
      data = typeof val === "string" ? JSON.parse(val) : val;
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, date, timeSlot, reason } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 });
    }

    // Retrieve current settings
    const rows = await sql.query(
      `SELECT value FROM settings WHERE key = 'studio_calendar_locks'`
    ).catch(() => []);

    let currentLocks: {
      lockedSlots: Array<{ date: string; timeSlot: string; reason?: string; lockedAt?: string }>;
      blockedDays: Array<{ date: string; reason?: string }>;
    } = {
      lockedSlots: [],
      blockedDays: [],
    };

    if (rows.length > 0 && rows[0].value) {
      const val = rows[0].value;
      currentLocks = typeof val === "string" ? JSON.parse(val) : val;
    }

    if (!Array.isArray(currentLocks.lockedSlots)) currentLocks.lockedSlots = [];
    if (!Array.isArray(currentLocks.blockedDays)) currentLocks.blockedDays = [];

    if (action === "lock_slot") {
      if (!date || !timeSlot) {
        return NextResponse.json({ success: false, error: "Date and timeSlot are required" }, { status: 400 });
      }
      // Remove any existing lock for same date & slot
      currentLocks.lockedSlots = currentLocks.lockedSlots.filter(
        (s) => !(s.date === date && s.timeSlot === timeSlot)
      );
      currentLocks.lockedSlots.push({
        date,
        timeSlot,
        reason: reason || "Studio Reserved",
        lockedAt: new Date().toISOString(),
      });
    } else if (action === "unlock_slot") {
      if (!date || !timeSlot) {
        return NextResponse.json({ success: false, error: "Date and timeSlot are required" }, { status: 400 });
      }
      currentLocks.lockedSlots = currentLocks.lockedSlots.filter(
        (s) => !(s.date === date && s.timeSlot === timeSlot)
      );
    } else if (action === "block_day") {
      if (!date) {
        return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
      }
      currentLocks.blockedDays = currentLocks.blockedDays.filter(
        (d) => (typeof d === "string" ? d !== date : d.date !== date)
      );
      currentLocks.blockedDays.push({
        date,
        reason: reason || "Studio Closed",
      });
    } else if (action === "unblock_day") {
      if (!date) {
        return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
      }
      currentLocks.blockedDays = currentLocks.blockedDays.filter(
        (d) => (typeof d === "string" ? d !== date : d.date !== date)
      );
    } else {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Persist into settings table
    const jsonStr = JSON.stringify(currentLocks);
    await sql.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('studio_calendar_locks', $1::jsonb, now())
       ON CONFLICT (key)
       DO UPDATE SET value = $1::jsonb, updated_at = now()`,
      [jsonStr]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully executed ${action}`,
      ...currentLocks,
    });
  } catch (err: any) {
    console.error("[Calendar Locks Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
