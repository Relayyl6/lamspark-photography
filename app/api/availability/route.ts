import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  expireStaleHeldBookings,
  extractDateAndSlotWAT,
  HOLD_DURATION_MS,
} from "@/lib/booking-hold";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // 0. Automatically release any unpaid 20-hour temporary holds that have expired
    await expireStaleHeldBookings(sql);

    // Construct start and end dates of target month (include ±1 day buffer around month boundary for WAT +01:00)
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const startDate = `${yearStr}-${monthStr.padStart(2, "0")}-01T00:00:00Z`;
    const lastDay = new Date(year, m, 0).getDate();
    const endDate = `${yearStr}-${monthStr.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;

    // 1. Fetch active booked or non-expired held slots from Neon DB
    const bookedRows = await sql.query(
      `SELECT 
        b.id,
        b.shoot_start,
        b.shoot_end,
        b.status,
        b.created_at,
        b.updated_at,
        e.session_type,
        e.reference_code,
        e.answers,
        e.stage,
        p.status as payment_status
       FROM booking b
       JOIN enquiry e ON b.enquiry_id = e.id
       LEFT JOIN payment p ON p.enquiry_id = e.id AND p.kind = 'deposit'
       WHERE b.status NOT IN ('cancelled', 'expired')
         AND b.shoot_start >= ($1::timestamptz - INTERVAL '1 day')
         AND b.shoot_start <= ($2::timestamptz + INTERVAL '1 day')
         AND (
           b.status != 'held'
           OR b.updated_at >= NOW() - INTERVAL '20 hours'
           OR p.status IN ('reported', 'confirmed', 'recorded')
           OR e.stage IN ('deposit_reported', 'deposit_paid', 'preparation', 'confirmed', 'shot', 'editing', 'client_review', 'delivered', 'closed')
         )
       ORDER BY b.shoot_start ASC`,
      [startDate, endDate]
    ).catch(async () => {
      // Fallback query if join fails
      return sql.query(
        `SELECT id, shoot_start, shoot_end, status, created_at, updated_at
         FROM booking 
         WHERE status NOT IN ('cancelled', 'expired')
           AND (status != 'held' OR updated_at >= NOW() - INTERVAL '20 hours')
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

    // Format booked slots with WAT date & timeSlot
    const formattedBooked = bookedRows
      .map((r: any) => {
        const answers =
          typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers || {};
        const { date, timeSlot } = extractDateAndSlotWAT(r.shoot_start, answers);
        const holdAnchor = new Date(r.updated_at || r.created_at).getTime();
        const holdExpiresAt =
          r.status === "held" &&
          !["reported", "confirmed", "recorded"].includes(r.payment_status)
            ? new Date(holdAnchor + HOLD_DURATION_MS).toISOString()
            : null;

        return {
          id: r.id,
          start: r.shoot_start,
          end: r.shoot_end,
          date,
          timeSlot,
          sessionType: r.session_type || "portrait",
          status:
            r.payment_status === "reported" && r.status === "held"
              ? "reported"
              : r.status,
          referenceCode: r.reference_code || null,
          holdExpiresAt,
        };
      })
      .filter((slot: any) => slot.date.startsWith(month));

    return NextResponse.json(
      {
        success: true,
        month,
        bookedSlots: formattedBooked,
        lockedSlots: calendarLocks.lockedSlots || [],
        blockedDays: (calendarLocks.blockedDays || []).map((b) =>
          typeof b === "string" ? b : b.date
        ),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("[Availability API Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve calendar availability" },
      { status: 500 }
    );
  }
}
