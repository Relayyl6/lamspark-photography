/**
 * Shared 20-hour temporary hold lifecycle and West Africa Time (Africa/Lagos, UTC+1)
 * scheduling utilities used across booking, availability, and studio admin APIs.
 */

export const HOLD_DURATION_HOURS = 20;
export const HOLD_DURATION_MS = HOLD_DURATION_HOURS * 60 * 60 * 1000;
export const ABUJA_TIMEZONE = "Africa/Lagos";

/**
 * Normalizes a YYYY-MM-DD calendar date and 12-hour slot string (e.g. "11:00 AM")
 * into UTC ISO timestamps treated as West Africa Time (Africa/Lagos, UTC+1).
 */
export function parseSlotToTimestampsWAT(
  dateStr: string,
  timeSlot: string,
  durationMinutes: number = 90
): { start: string; end: string } {
  try {
    const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      // Fallback: if dateStr already includes time/timezone or ISO string
      const fallbackStart = new Date(dateStr);
      if (!isNaN(fallbackStart.getTime())) {
        const fallbackEnd = new Date(fallbackStart.getTime() + durationMinutes * 60000);
        return { start: fallbackStart.toISOString(), end: fallbackEnd.toISOString() };
      }
      throw new Error("Invalid date/slot input");
    }

    const [, hoursStr, minsStr, ampm] = match;
    let hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);
    if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;

    // Construct ISO string with explicit Abuja +01:00 offset so UTC instant is exact
    const isoWithOffset = `${dateStr.trim()}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00+01:00`;
    const start = new Date(isoWithOffset);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    return { start: start.toISOString(), end: end.toISOString() };
  } catch {
    const now = new Date();
    return {
      start: now.toISOString(),
      end: new Date(now.getTime() + durationMinutes * 60000).toISOString(),
    };
  }
}

/**
 * Formats a database timestamp (or stored slot) into YYYY-MM-DD and "hh:mm AM/PM"
 * in Abuja Time (Africa/Lagos), preferring explicit answers.timeSlot if available.
 */
export function extractDateAndSlotWAT(
  shootStart: string | Date,
  answers?: Record<string, any> | null
): { date: string; timeSlot: string } {
  const start = new Date(shootStart);
  if (isNaN(start.getTime())) {
    return {
      date: (answers?.selectedDate as string) || "",
      timeSlot: (answers?.timeSlot as string) || "",
    };
  }

  // Format date in Africa/Lagos YYYY-MM-DD
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ABUJA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(start);
  const y = dateParts.find((p) => p.type === "year")?.value || "2026";
  const m = dateParts.find((p) => p.type === "month")?.value || "01";
  const d = dateParts.find((p) => p.type === "day")?.value || "01";
  const dateStr = `${y}-${m}-${d}`;

  // Format 12-hour time in Africa/Lagos (e.g. "09:30 AM", "01:30 PM")
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ABUJA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(start);
  const hr = (timeParts.find((p) => p.type === "hour")?.value || "09").padStart(2, "0");
  const min = (timeParts.find((p) => p.type === "minute")?.value || "30").padStart(2, "0");
  const dayPeriod = (timeParts.find((p) => p.type === "dayPeriod")?.value || "AM").toUpperCase();
  const formattedTime = `${hr}:${min} ${dayPeriod}`;

  return {
    date: dateStr,
    timeSlot: formattedTime || (answers?.timeSlot as string) || "",
  };
}

/**
 * Releases any unpaid temporary holds that have exceeded the 20-hour reservation window.
 * A hold is protected from expiration if:
 *  - A deposit payment row exists with status 'reported', 'confirmed', or 'recorded'
 *  - Or the associated enquiry has advanced to 'deposit_reported', 'deposit_paid', 'preparation', 'confirmed', etc.
 */
export async function expireStaleHeldBookings(sql: any): Promise<number> {
  try {
    const expiredRows = await sql.query(
      `UPDATE booking b
       SET status = 'expired',
           updated_at = NOW()
       FROM enquiry e
       WHERE b.enquiry_id = e.id
         AND b.status = 'held'
         AND b.updated_at < NOW() - INTERVAL '20 hours'
         AND COALESCE(e.stage, 'enquiry') NOT IN (
           'deposit_reported',
           'deposit_paid',
           'preparation',
           'confirmed',
           'shot',
           'editing',
           'client_review',
           'delivered',
           'closed'
         )
         AND NOT EXISTS (
           SELECT 1
           FROM payment p
           WHERE p.enquiry_id = e.id
             AND p.kind = 'deposit'
             AND p.status IN ('reported', 'confirmed', 'recorded')
         )
       RETURNING b.id, e.id as enquiry_id, e.reference_code`
    );

    if (Array.isArray(expiredRows) && expiredRows.length > 0) {
      const { dispatchBookingEmail } = await import("@/lib/email/mailer");
      for (const row of expiredRows) {
        await dispatchBookingEmail(sql, "hold_ended", { enquiryId: row.enquiry_id }).catch((e) =>
          console.warn("[expireStaleHeldBookings email notice]", e)
        );
      }
    }

    return Array.isArray(expiredRows) ? expiredRows.length : 0;
  } catch (err) {
    console.error("[expireStaleHeldBookings error]", err);
    return 0;
  }
}
