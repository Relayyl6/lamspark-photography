import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";
import { expireStaleHeldBookings, HOLD_DURATION_MS } from "@/lib/booking-hold";

const sql = neon(process.env.DATABASE_URL!);

// GET: fetch all studio bookings
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await expireStaleHeldBookings(sql);

    const rawBookings = await sql.query(`
      SELECT 
        b.id,
        b.enquiry_id,
        b.shoot_start,
        b.shoot_end,
        b.location_type,
        b.location_detail,
        b.status as booking_status,
        b.reschedule_count,
        b.created_at,
        b.updated_at,
        e.reference_code,
        e.session_type,
        e.purpose_text,
        e.feeling_text,
        e.stage as enquiry_stage,
        e.answers,
        c.id as client_id,
        c.name as client_name,
        c.whatsapp_e164 as whatsapp,
        c.email as client_email,
        p.amount_expected,
        p.amount_recorded,
        p.bank_reference,
        p.status as payment_status
      FROM booking b
      JOIN enquiry e ON b.enquiry_id = e.id
      JOIN client c ON e.client_id = c.id
      LEFT JOIN LATERAL (
        SELECT amount_expected, amount_recorded, bank_reference, status
        FROM payment 
        WHERE payment.enquiry_id = e.id AND payment.kind = 'deposit'
        ORDER BY created_at DESC LIMIT 1
      ) p ON true
      ORDER BY b.shoot_start ASC
    `);

    const bookings = rawBookings.map((b: any) => {
      const answers = typeof b.answers === "string" ? JSON.parse(b.answers) : (b.answers || {});
      const agreedPrice = answers.agreedPrice || (b.amount_expected ? Math.round(b.amount_expected / 0.7) : 0);
      const balanceDue = Math.max(0, agreedPrice - (b.amount_recorded || b.amount_expected || 0));
      const holdAnchor = new Date(b.updated_at || b.created_at).getTime();

      return {
        id: b.id,
        enquiry_id: b.enquiry_id,
        shoot_start: b.shoot_start,
        shoot_end: b.shoot_end,
        location_type: b.location_type,
        location_detail: b.location_detail,
        status: b.booking_status,
        hold_expires_at:
          b.booking_status === "held"
            ? new Date(holdAnchor + HOLD_DURATION_MS).toISOString()
            : null,
        reschedule_count: b.reschedule_count,
        reference_code: b.reference_code,
        session_type: b.session_type,
        purpose_text: b.purpose_text,
        agreed_price: agreedPrice,
        deposit_recorded: b.amount_recorded || b.amount_expected || 0,
        balance_due: balanceDue,
        bank_reference: b.bank_reference,
        client: {
          id: b.client_id,
          name: b.client_name,
          whatsapp: b.whatsapp,
          email: b.client_email,
        },
        created_at: b.created_at,
      };
    });

    return NextResponse.json({ bookings });
  } catch (err: any) {
    console.error("[bookings GET error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: update booking status or schedule
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, shootStart, shootEnd, locationType, locationDetail } = body;

    if (!id) {
      return NextResponse.json({ error: "Booking id is required" }, { status: 400 });
    }

    const updated = await sql.query(
      `UPDATE booking
       SET 
         status = COALESCE($1, status),
         shoot_start = COALESCE($2, shoot_start),
         shoot_end = COALESCE($3, shoot_end),
         location_type = COALESCE($4, location_type),
         location_detail = COALESCE($5, location_detail),
         updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        status || null,
        shootStart ? new Date(shootStart).toISOString() : null,
        shootEnd ? new Date(shootEnd).toISOString() : null,
        locationType || null,
        locationDetail || null,
        id,
      ]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking: updated[0] });
  } catch (err: any) {
    console.error("[bookings PUT error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: permanently delete a booking and its associated enquiry and records
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    let ref = searchParams.get("ref");

    if (!id && !ref) {
      try {
        const body = await req.json();
        id = body.id;
        ref = body.ref;
      } catch (_) {}
    }

    if (!id && !ref) {
      return NextResponse.json({ error: "Booking id or ref is required" }, { status: 400 });
    }

    // Find the booking and associated enquiry_id
    let bookingRows: any[];
    if (id) {
      bookingRows = await sql.query(
        `SELECT b.id, b.enquiry_id, e.reference_code 
         FROM booking b 
         LEFT JOIN enquiry e ON b.enquiry_id = e.id 
         WHERE b.id = $1 LIMIT 1`,
        [id]
      );
    } else {
      bookingRows = await sql.query(
        `SELECT b.id, b.enquiry_id, e.reference_code 
         FROM booking b 
         LEFT JOIN enquiry e ON b.enquiry_id = e.id 
         WHERE e.reference_code = $1 LIMIT 1`,
        [ref]
      );
    }

    if (bookingRows.length === 0) {
      // Check if the provided id was actually an enquiry_id
      if (id) {
        const altRows = await sql.query(
          `SELECT b.id, b.enquiry_id, e.reference_code
           FROM enquiry e
           LEFT JOIN booking b ON b.enquiry_id = e.id
           WHERE e.id = $1 LIMIT 1`,
          [id]
        );
        if (altRows.length > 0) {
          bookingRows = altRows;
        }
      }
    }

    if (bookingRows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const targetBooking = bookingRows[0];
    const bookingId = targetBooking.id;
    const enquiryId = targetBooking.enquiry_id;

    // Delete dependent records
    if (bookingId) {
      await sql.query(`DELETE FROM booking WHERE id = $1`, [bookingId]);
    }

    if (enquiryId) {
      await sql.query(`DELETE FROM payment WHERE enquiry_id = $1`, [enquiryId]);
      await sql.query(`DELETE FROM booking WHERE enquiry_id = $1`, [enquiryId]);
      await sql.query(`DELETE FROM estimate_snapshot WHERE enquiry_id = $1`, [enquiryId]);
      try {
        await sql.query(`DELETE FROM conversation WHERE enquiry_id = $1`, [enquiryId]);
      } catch (_) {}
      await sql.query(`DELETE FROM enquiry WHERE id = $1`, [enquiryId]);
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${targetBooking.reference_code || ""} deleted successfully`,
      deletedBookingId: bookingId,
      deletedEnquiryId: enquiryId,
    });
  } catch (err: any) {
    console.error("[bookings DELETE error]", err);
    return NextResponse.json({ error: err.message || "Failed to delete booking" }, { status: 500 });
  }
}

