import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Construct start and end dates of target month
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const startDate = `${yearStr}-${monthStr.padStart(2, "0")}-01T00:00:00Z`;
    // Last day of month
    const lastDay = new Date(year, m, 0).getDate();
    const endDate = `${yearStr}-${monthStr.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;

    // 1. Fetch real booked slots from Neon DB
    const bookedRows = await sql.query(
      `SELECT 
        b.id,
        b.shoot_start,
        b.shoot_end,
        b.status,
        e.session_type,
        e.reference_code,
        e.answers
       FROM booking b
       JOIN enquiry e ON b.enquiry_id = e.id
       WHERE b.status != 'cancelled'
         AND b.shoot_start >= $1
         AND b.shoot_start <= $2
       ORDER BY b.shoot_start ASC`,
      [startDate, endDate]
    ).catch(async () => {
      // Fallback query if enquiry JOIN fails
      return sql.query(
        `SELECT id, shoot_start, shoot_end, status 
         FROM booking 
         WHERE status != 'cancelled' 
           AND shoot_start >= $1 
           AND shoot_start <= $2
         ORDER BY shoot_start ASC`,
        [startDate, endDate]
      ).catch(() => []);
    });

    // 2. Fetch studio calendar locks (manual slot locks and blocked days by studio)
    const lockRows = await sql.query(
      `SELECT value FROM settings WHERE key = 'studio_calendar_locks'`
    ).catch(() => []);

    let calendarLocks: {
      lockedSlots: Array<{ date: string; timeSlot: string; reason?: string }>;
      blockedDays: Array<{ date: string; reason?: string } | string>;
    } = {
      lockedSlots: [],
      blockedDays: [],
    };

    if (lockRows.length > 0 && lockRows[0].value) {
      const val = lockRows[0].value;
      calendarLocks = typeof val === "string" ? JSON.parse(val) : val;
    }

    // Format booked slots with parsed date and time
    const formattedBooked = bookedRows.map((r: any) => {
      const start = new Date(r.shoot_start);
      const dateStr = start.toISOString().split("T")[0];
      // Format 12-hour slot
      let hours = start.getUTCHours();
      const minutes = start.getUTCMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;

      return {
        id: r.id,
        start: r.shoot_start,
        end: r.shoot_end,
        date: dateStr,
        timeSlot: (r.answers?.timeSlot as string) || timeStr,
        sessionType: r.session_type || "portrait",
        status: r.status,
        referenceCode: r.reference_code || null,
      };
    });

    return NextResponse.json({
      success: true,
      month,
      bookedSlots: formattedBooked,
      lockedSlots: calendarLocks.lockedSlots || [],
      blockedDays: (calendarLocks.blockedDays || []).map((b) => (typeof b === "string" ? b : b.date)),
    });
  } catch (err: any) {
    console.error("[Availability API Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve calendar availability" },
      { status: 500 }
    );
  }
}
