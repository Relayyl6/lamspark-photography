/**
 * Shared 20-hour temporary hold lifecycle and West Africa Time (Africa/Lagos, UTC+1)
 * scheduling utilities used across booking, availability, and studio admin APIs.
 */

export {
  HOLD_DURATION_HOURS,
  HOLD_DURATION_MS,
  ABUJA_TIMEZONE,
  parseSlotToTimestampsWAT,
  extractDateAndSlotWAT,
} from "./booking-time";

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
