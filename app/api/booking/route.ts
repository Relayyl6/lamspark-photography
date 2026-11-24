import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { calculateEstimate } from "@/lib/estimate/engine";
import { BookingAnswers, SessionTypeSlug } from "@/lib/types";

const sql = neon(process.env.DATABASE_URL!);

// Helper: parse date and time slot into ISO timestamps
function parseSlotToTimestamps(dateStr: string, timeSlot: string, durationMinutes: number = 120) {
  try {
    // Expected dateStr: "YYYY-MM-DD"
    // Expected timeSlot: "09:00 AM", "01:30 PM", etc.
    const match = timeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      const fallbackStart = new Date(dateStr);
      const fallbackEnd = new Date(fallbackStart.getTime() + durationMinutes * 60000);
      return { start: fallbackStart.toISOString(), end: fallbackEnd.toISOString() };
    }
    let [_, hoursStr, minsStr, ampm] = match;
    let hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);
    if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;

    const [year, month, day] = dateStr.split("-").map((n) => parseInt(n, 10));
    const start = new Date(Date.UTC(year, month - 1, day, hours, mins, 0));
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return { start: start.toISOString(), end: end.toISOString() };
  } catch {
    const now = new Date();
    return { start: now.toISOString(), end: new Date(now.getTime() + 7200000).toISOString() };
  }
}

// GET: Query booking by ref code OR get calendar availability
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const availability = searchParams.get("availability");
    const month = searchParams.get("month"); // e.g. "2026-11"

    // Availability lookup for live calendar
    if (availability === "true" || month) {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const startOfMonth = `${targetMonth}-01T00:00:00Z`;
      const endOfMonth = `${targetMonth}-31T23:59:59Z`;

      const bookedRows = await sql.query(
        `SELECT shoot_start, shoot_end, status 
         FROM booking 
         WHERE status != 'cancelled' 
           AND shoot_start >= $1 
           AND shoot_start <= $2`,
        [startOfMonth, endOfMonth]
      );

      return NextResponse.json({
        success: true,
        month: targetMonth,
        bookedSlots: bookedRows.map((r: any) => ({
          start: r.shoot_start,
          end: r.shoot_end,
          status: r.status,
        })),
      });
    }

    if (!ref) {
      return NextResponse.json({ error: "Reference code or id is required." }, { status: 400 });
    }

    const cleanRef = ref.trim().toUpperCase();

    const rows = await sql.query(
      `SELECT 
        e.id as enquiry_id,
        e.reference_code,
        e.session_type,
        e.stage as enquiry_stage,
        e.waiting_on,
        e.purpose_text,
        e.feeling_text,
        e.answers,
        e.closed_reason,
        e.created_at as enquiry_created_at,
        c.id as client_id,
        c.name as client_name,
        c.whatsapp_e164 as whatsapp,
        c.email as client_email,
        b.id as booking_id,
        b.shoot_start,
        b.shoot_end,
        b.location_type,
        b.location_detail,
        b.status as booking_status,
        b.reschedule_count,
        b.created_at as booking_created_at,
        p.id as payment_id,
        p.amount_expected,
        p.amount_recorded,
        p.status as payment_status,
        p.screenshot_asset_id,
        es.total,
        es.deposit_percent,
        es.deposit_amount,
        es.balance_amount,
        es.line_items,
        es.valid_until
      FROM enquiry e
      JOIN client c ON e.client_id = c.id
      LEFT JOIN booking b ON b.enquiry_id = e.id
      LEFT JOIN payment p ON p.enquiry_id = e.id AND p.kind = 'deposit'
      LEFT JOIN estimate_snapshot es ON es.enquiry_id = e.id
      WHERE e.reference_code = $1 
         OR b.id::text = $2 
         OR e.id::text = $2
      ORDER BY b.created_at DESC NULLS LAST
      LIMIT 1`,
      [cleanRef, ref.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = rows[0];
    const answers = typeof b.answers === "string" ? JSON.parse(b.answers) : b.answers || {};

    // Determine status
    let status = b.booking_status || "held";
    if (status === "cancelled" || b.enquiry_stage === "lost") {
      status = "cancelled";
    } else if (b.payment_status === "confirmed" || b.enquiry_stage === "deposit_confirmed") {
      status = "confirmed";
    } else if (b.payment_status === "reported" || b.enquiry_stage === "deposit_reported") {
      status = "reported";
    } else {
      status = "awaiting_deposit";
    }

    // Calculate hold expiration (2 hours from creation by default)
    const createdAtTime = new Date(b.booking_created_at || b.enquiry_created_at).getTime();
    const holdExpiresAt = new Date(createdAtTime + 2 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      booking: {
        id: b.booking_id,
        enquiryId: b.enquiry_id,
        referenceCode: b.reference_code,
        status,
        sessionType: b.session_type,
        shootStart: b.shoot_start,
        shootEnd: b.shoot_end,
        rescheduleCount: b.reschedule_count || 0,
        locationType: b.location_type || "Private Abuja Studio",
        locationDetail: b.location_detail,
        closedReason: b.closed_reason,
        holdExpiresAt,
        createdAt: b.booking_created_at || b.enquiry_created_at,
        client: {
          id: b.client_id,
          name: b.client_name,
          whatsapp: b.whatsapp,
          email: b.client_email,
        },
        estimate: {
          total: b.total || answers.agreedPrice || 0,
          depositAmount: b.deposit_amount || Math.round((b.total || 0) * 0.7),
          balanceAmount: b.balance_amount || Math.round((b.total || 0) * 0.3),
          depositPercent: b.deposit_percent || 70,
          lineItems: typeof b.line_items === "string" ? JSON.parse(b.line_items) : b.line_items || [],
        },
        answers,
        payment: {
          id: b.payment_id,
          status: b.payment_status,
          receiptUrl: b.screenshot_asset_id,
        },
      },
    });
  } catch (err: any) {
    console.error("[booking GET error]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch booking" }, { status: 500 });
  }
}

// POST: create a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName,
      whatsappPhone,
      clientEmail,
      sessionType,
      answers,
      referenceCode,
      selectedDate,
      timeSlot,
      shootStart: explicitShootStart,
      shootEnd: explicitShootEnd,
      priceAgreed = false,
      messagingConsent = true,
      marketingConsent = false,
      receiptUrl = null,
      source = "Website Booking Wizard",
    } = body as {
      clientName: string;
      whatsappPhone: string;
      clientEmail?: string;
      sessionType: SessionTypeSlug;
      answers: BookingAnswers;
      referenceCode?: string;
      selectedDate?: string;
      timeSlot?: string;
      shootStart?: string;
      shootEnd?: string;
      priceAgreed?: boolean;
      messagingConsent?: boolean;
      marketingConsent?: boolean;
      receiptUrl?: string | null;
      source?: string;
    };

    if (!clientName?.trim() || !whatsappPhone?.trim() || !sessionType) {
      return NextResponse.json(
        { error: "Client name, WhatsApp phone number, and session type are required." },
        { status: 400 }
      );
    }

    // Normalise Nigerian WhatsApp phone number
    let cleanPhone = whatsappPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.slice(1);
    }
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = "+" + cleanPhone;
    }

    const refCode =
      referenceCode?.trim() ||
      "LS-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    // 1. Calculate live estimate
    const estimate = calculateEstimate(sessionType, answers || {}, answers?.packageId);

    // 2. Insert or update client in DB
    const clientRows = await sql.query(
      `INSERT INTO client (
        id, name, whatsapp_e164, email, source_first, 
        messaging_consent, marketing_consent, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        $5, $6, NOW(), NOW()
      )
      ON CONFLICT (whatsapp_e164) DO UPDATE SET
        name = EXCLUDED.name,
        email = COALESCE(EXCLUDED.email, client.email),
        messaging_consent = EXCLUDED.messaging_consent,
        marketing_consent = EXCLUDED.marketing_consent,
        updated_at = NOW()
      RETURNING id, name, whatsapp_e164, email`,
      [
        clientName.trim(),
        cleanPhone,
        clientEmail?.trim() || null,
        source,
        messagingConsent,
        marketingConsent,
      ]
    );

    const client = clientRows[0];
    const initialStage = receiptUrl ? "deposit_reported" : priceAgreed ? "agreed_to_price" : "enquiry";
    const initialWaitingOn = receiptUrl ? "us" : "client";

    // 3. Insert enquiry
    const enquiryRows = await sql.query(
      `INSERT INTO enquiry (
        id, client_id, session_type, stage, waiting_on, 
        stage_entered_at, source, reference_code, purpose_text, 
        feeling_text, answers, custom_quote, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        NOW(), $5, $6, $7,
        $8, $9, $10, NOW(), NOW()
      )
      ON CONFLICT (reference_code) DO UPDATE SET
        stage = EXCLUDED.stage,
        waiting_on = EXCLUDED.waiting_on,
        answers = EXCLUDED.answers,
        updated_at = NOW()
      RETURNING *`,
      [
        client.id,
        sessionType,
        initialStage,
        initialWaitingOn,
        source,
        refCode,
        answers?.purpose || `${sessionType} Session`,
        answers?.feeling || null,
        JSON.stringify({ ...answers, agreedPrice: estimate.total, selectedDate, timeSlot }),
        estimate.quoteRequired,
      ]
    );

    const enquiry = enquiryRows[0];

    // 4. Record estimate snapshot
    await sql.query(
      `INSERT INTO estimate_snapshot (
        id, enquiry_id, line_items, total, deposit_percent, 
        deposit_amount, balance_amount, rules_version, valid_until, 
        price_agreed_at, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        $5, $6, '2026.1', NOW() + INTERVAL '7 days', 
        ${priceAgreed ? "NOW()" : "NULL"}, NOW(), NOW()
      )`,
      [
        enquiry.id,
        JSON.stringify(estimate.lineItems),
        estimate.total,
        estimate.depositPercent,
        estimate.depositAmount,
        estimate.balanceAmount,
      ]
    );

    // 5. Create or update booking slot
    let bookingRecord = null;
    let shootStart = explicitShootStart;
    let shootEnd = explicitShootEnd;

    if (!shootStart && selectedDate && timeSlot) {
      const timestamps = parseSlotToTimestamps(selectedDate, timeSlot);
      shootStart = timestamps.start;
      shootEnd = timestamps.end;
    }

    if (shootStart) {
      const locationType = answers?.locationType || "studio";
      const locationDetail = locationType === "studio" ? "LamSparks Private Abuja Studio" : "Client Location / Outdoor";

      const bookingRows = await sql.query(
        `INSERT INTO booking (
          id, enquiry_id, shoot_start, shoot_end, location_type, location_detail,
          status, reschedule_count, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          'held', 0, NOW(), NOW()
        )
        RETURNING *`,
        [
          enquiry.id,
          shootStart,
          shootEnd || new Date(new Date(shootStart).getTime() + 7200000).toISOString(),
          locationType,
          locationDetail,
        ]
      );
      bookingRecord = bookingRows[0];
    }

    // 6. If receipt was uploaded, insert payment record
    let paymentRecord = null;
    if (receiptUrl) {
      const paymentRows = await sql.query(
        `INSERT INTO payment (
          id, enquiry_id, kind, amount_expected, status, 
          screenshot_asset_id, ai_check, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), $1, 'deposit', $2, 'reported',
          $3, $4, NOW(), NOW()
        )
        RETURNING *`,
        [
          enquiry.id,
          estimate.depositAmount,
          receiptUrl,
          JSON.stringify({
            summary: "Receipt uploaded via Client Booking Wizard. Pending staff bank verification.",
            extractedAmount: estimate.depositAmount,
            reference: refCode,
            status: "pending_verification",
          }),
        ]
      );
      paymentRecord = paymentRows[0];
    }

    // Hold deadline is 2 hours from now
    const holdExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    return NextResponse.json(
      {
        success: true,
        referenceCode: refCode,
        client,
        enquiry,
        estimate,
        booking: bookingRecord,
        payment: paymentRecord,
        holdExpiresAt,
        stage: initialStage,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[booking POST error]", err);
    return NextResponse.json({ error: err.message || "Failed to submit booking" }, { status: 500 });
  }
}

// PATCH: self-serve manage booking (reschedule, cancel, upload receipt)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { referenceCode, action, newDate, newTimeSlot, reason, receiptUrl } = body;

    if (!referenceCode) {
      return NextResponse.json({ error: "Reference code is required." }, { status: 400 });
    }

    const cleanRef = referenceCode.trim().toUpperCase();

    // Find the enquiry and associated booking
    const enquiryRows = await sql.query(
      `SELECT e.id as enquiry_id, b.id as booking_id, b.reschedule_count
       FROM enquiry e
       LEFT JOIN booking b ON b.enquiry_id = e.id
       WHERE e.reference_code = $1
       LIMIT 1`,
      [cleanRef]
    );

    if (enquiryRows.length === 0) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const { enquiry_id, booking_id, reschedule_count } = enquiryRows[0];

    if (action === "reschedule") {
      if (!newDate || !newTimeSlot) {
        return NextResponse.json({ error: "newDate and newTimeSlot are required for rescheduling." }, { status: 400 });
      }
      const { start, end } = parseSlotToTimestamps(newDate, newTimeSlot);

      if (booking_id) {
        await sql.query(
          `UPDATE booking 
           SET shoot_start = $1, 
               shoot_end = $2, 
               status = 'held',
               reschedule_count = COALESCE(reschedule_count, 0) + 1, 
               updated_at = NOW() 
           WHERE id = $3`,
          [start, end, booking_id]
        );
      } else {
        await sql.query(
          `INSERT INTO booking (
             id, enquiry_id, shoot_start, shoot_end, location_type, location_detail,
             status, reschedule_count, created_at, updated_at
           ) VALUES (
             gen_random_uuid(), $1, $2, $3, 'studio', 'LamSparks Private Abuja Studio',
             'held', 1, NOW(), NOW()
           )`,
          [enquiry_id, start, end]
        );
      }

      // Also record updated answers in enquiry
      await sql.query(
        `UPDATE enquiry 
         SET answers = jsonb_set(
           jsonb_set(COALESCE(answers, '{}'::jsonb), '{selectedDate}', to_jsonb($1::text)),
           '{timeSlot}', to_jsonb($2::text)
         ),
         updated_at = NOW()
         WHERE id = $3`,
        [newDate, newTimeSlot, enquiry_id]
      );

      return NextResponse.json({
        success: true,
        message: "Session successfully rescheduled.",
        shootStart: start,
        shootEnd: end,
      });
    }

    if (action === "cancel") {
      if (booking_id) {
        await sql.query(
          `UPDATE booking 
           SET status = 'cancelled', 
               updated_at = NOW() 
           WHERE id = $1`,
          [booking_id]
        );
      }

      await sql.query(
        `UPDATE enquiry 
         SET stage = 'lost', 
             closed_at = NOW(), 
             closed_reason = $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [reason || "Cancelled by client via booking self-service link", enquiry_id]
      );

      return NextResponse.json({
        success: true,
        message: "Booking has been cancelled.",
      });
    }

    if (action === "report_deposit") {
      if (!receiptUrl) {
        return NextResponse.json({ error: "Receipt URL is required." }, { status: 400 });
      }

      await sql.query(
        `INSERT INTO payment (
          id, enquiry_id, kind, status, screenshot_asset_id, ai_check, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, 'deposit', 'reported', $2,
          $3, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING`,
        [
          enquiry_id,
          receiptUrl,
          JSON.stringify({
            summary: "Receipt uploaded via Client Booking Self-Service. Pending staff bank verification.",
            reference: cleanRef,
            status: "pending_verification",
          }),
        ]
      );

      await sql.query(
        `UPDATE enquiry 
         SET stage = 'deposit_reported', 
             waiting_on = 'us', 
             updated_at = NOW() 
         WHERE id = $1`,
        [enquiry_id]
      );

      return NextResponse.json({
        success: true,
        message: "Receipt reported successfully. Verification in progress.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("[booking PATCH error]", err);
    return NextResponse.json({ error: err.message || "Failed to update booking" }, { status: 500 });
  }
}

