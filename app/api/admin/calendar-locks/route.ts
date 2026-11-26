import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

function normalizeSlot(s: string) {
  return (s || "").trim().toUpperCase().replace(/^0/, "");
}

function normalizeDate(d: string) {
  return (d || "").trim().slice(0, 10);
}

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

    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
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

    const normDate = date ? normalizeDate(date) : "";
    const normSlot = timeSlot ? normalizeSlot(timeSlot) : "";

    if (action === "lock_slot") {
      if (!normDate || !normSlot) {
        return NextResponse.json({ success: false, error: "Date and timeSlot are required" }, { status: 400 });
      }
      // Remove any existing lock for same normalized date & slot
      currentLocks.lockedSlots = currentLocks.lockedSlots.filter(
        (s) => !(normalizeDate(s.date) === normDate && normalizeSlot(s.timeSlot) === normSlot)
      );
      currentLocks.lockedSlots.push({
        date: normDate,
        timeSlot: timeSlot.trim(),
        reason: reason || "Studio Reserved",
        lockedAt: new Date().toISOString(),
      });
    } else if (action === "unlock_slot") {
      if (!normDate || !normSlot) {
        return NextResponse.json({ success: false, error: "Date and timeSlot are required" }, { status: 400 });
      }
      currentLocks.lockedSlots = currentLocks.lockedSlots.filter(
        (s) => !(normalizeDate(s.date) === normDate && normalizeSlot(s.timeSlot) === normSlot)
      );
    } else if (action === "block_day") {
      if (!normDate) {
        return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
      }
      currentLocks.blockedDays = currentLocks.blockedDays.filter(
        (d) => normalizeDate(typeof d === "string" ? d : d.date) !== normDate
      );
      currentLocks.blockedDays.push({
        date: normDate,
        reason: reason || "Studio Closed",
      });
    } else if (action === "unblock_day") {
      if (!normDate) {
        return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
      }
      currentLocks.blockedDays = currentLocks.blockedDays.filter(
        (d) => normalizeDate(typeof d === "string" ? d : d.date) !== normDate
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

    return NextResponse.json(
      {
        success: true,
        message: `Successfully executed ${action}`,
        ...currentLocks,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("[Calendar Locks Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
