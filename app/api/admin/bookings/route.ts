import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET: fetch all studio bookings
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
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

      return {
        id: b.id,
        enquiry_id: b.enquiry_id,
        shoot_start: b.shoot_start,
        shoot_end: b.shoot_end,
        location_type: b.location_type,
        location_detail: b.location_detail,
        status: b.booking_status,
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
