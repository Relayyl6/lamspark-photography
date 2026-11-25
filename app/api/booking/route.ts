import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { calculateEstimate } from "@/lib/estimate/engine";
import { getLivePackages, getLiveSessionTypes } from "@/lib/catalog/live";
import {
  expireStaleHeldBookings,
  extractDateAndSlotWAT,
  HOLD_DURATION_MS,
  parseSlotToTimestampsWAT,
} from "@/lib/booking-hold";
import { BookingAnswers, SessionTypeSlug } from "@/lib/types";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Checks whether a target WAT date ("YYYY-MM-DD") and time slot ("11:00 AM")
 * is blocked by studio locks or already held/booked by an active reservation.
 */
async function checkSlotConflict(
  targetDate: string,
  targetTimeSlot: string,
  excludeEnquiryId?: string
): Promise<{ conflict: boolean; reason?: string }> {
  if (!targetDate || !targetTimeSlot) return { conflict: false };

  // 1. Check studio calendar locks & blocked days
  const lockRows = await sql
    .query(`SELECT value FROM settings WHERE key = 'studio_calendar_locks' LIMIT 1`)
    .catch(() => []);

  if (lockRows.length > 0 && lockRows[0].value) {
    const locks =
      typeof lockRows[0].value === "string"
        ? JSON.parse(lockRows[0].value)
        : lockRows[0].value;

    const isDayBlocked = (locks.blockedDays || []).some((b: any) =>
      typeof b === "string" ? b === targetDate : b?.date === targetDate
    );
    if (isDayBlocked) {
      return { conflict: true, reason: "Studio is closed on the selected date." };
    }

    const lockedSlot = (locks.lockedSlots || []).find(
      (l: any) => l?.date === targetDate && l?.timeSlot === targetTimeSlot
    );
    if (lockedSlot) {
      return {
        conflict: true,
        reason: `This time slot is reserved by the studio (${lockedSlot.reason || "Studio Locked"}).`,
      };
    }
  }

  // 2. Check active bookings (non-cancelled, non-expired) on the target date
  const activeRows = await sql.query(
    `SELECT b.id, b.enquiry_id, b.shoot_start, b.status, b.updated_at, e.answers, e.stage, p.status as payment_status
     FROM booking b
     JOIN enquiry e ON b.enquiry_id = e.id
     LEFT JOIN payment p ON p.enquiry_id = e.id AND p.kind = 'deposit'
     WHERE b.status NOT IN ('cancelled', 'expired')
       AND b.shoot_start >= ($1::date - INTERVAL '1 day')
       AND b.shoot_start <= ($1::date + INTERVAL '2 days')
       AND (
         b.status != 'held'
         OR b.updated_at >= NOW() - INTERVAL '20 hours'
         OR p.status IN ('reported', 'confirmed', 'recorded')
         OR e.stage IN ('deposit_reported', 'deposit_paid', 'preparation', 'confirmed', 'shot', 'editing', 'client_review', 'delivered', 'closed')
       )`,
    [targetDate]
  ).catch(() => []);

  for (const r of activeRows) {
    if (excludeEnquiryId && r.enquiry_id === excludeEnquiryId) continue;
    const ans = typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers || {};
    const { date, timeSlot } = extractDateAndSlotWAT(r.shoot_start, ans);
    if (date === targetDate && timeSlot === targetTimeSlot) {
      const label = r.status === "held" ? "temporarily held by another client" : "already booked";
      return {
        conflict: true,
        reason: `Sorry, ${targetTimeSlot} on ${targetDate} is ${label}. Please select another open time slot.`,
      };
    }
  }

  return { conflict: false };
}

// GET: Query booking by ref code OR get calendar availability
export async function GET(req: NextRequest) {
  try {
    // Ensure expired 20-hour unpaid holds are released automatically
    await expireStaleHeldBookings(sql);

    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const availability = searchParams.get("availability");
    const month = searchParams.get("month"); // e.g. "2026-11"

    // Availability lookup
    if (availability === "true" || month) {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const [yearStr, monthStr] = targetMonth.split("-");
      const lastDay = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
      const startOfMonth = `${targetMonth}-01T00:00:00Z`;
      const endOfMonth = `${targetMonth}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;

      const bookedRows = await sql.query(
        `SELECT b.shoot_start, b.shoot_end, b.status, b.updated_at, e.stage, p.status as payment_status
         FROM booking b
         LEFT JOIN enquiry e ON b.enquiry_id = e.id
         LEFT JOIN payment p ON p.enquiry_id = e.id AND p.kind = 'deposit'
         WHERE b.status NOT IN ('cancelled', 'expired')
           AND b.shoot_start >= ($1::timestamptz - INTERVAL '1 day')
           AND b.shoot_start <= ($2::timestamptz + INTERVAL '1 day')
           AND (
             b.status != 'held'
             OR b.updated_at >= NOW() - INTERVAL '20 hours'
             OR p.status IN ('reported', 'confirmed', 'recorded')
             OR e.stage IN ('deposit_reported', 'deposit_paid', 'preparation', 'confirmed', 'shot', 'editing', 'client_review', 'delivered', 'closed')
           )`,
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
        b.updated_at as booking_updated_at,
        p.id as payment_id,
        p.amount_expected,
        p.amount_recorded,
        p.status as payment_status,
        p.screenshot_asset_id,
        p.bank_reference,
        p.ai_check,
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
      ORDER BY b.created_at DESC NULLS LAST, p.created_at DESC NULLS LAST
      LIMIT 1`,
      [cleanRef, ref.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = rows[0];
    const answers = typeof b.answers === "string" ? JSON.parse(b.answers) : b.answers || {};

    // Canonical hold expiration timestamp (20 hours from last active hold anchor)
    const holdAnchorTime = new Date(
      b.booking_updated_at || b.booking_created_at || b.enquiry_created_at
    ).getTime();
    const holdExpiresAt = new Date(holdAnchorTime + HOLD_DURATION_MS).toISOString();
    const isHoldPastDue = Date.now() >= holdAnchorTime + HOLD_DURATION_MS;

    // Determine authoritative booking status
    const confirmedStages = new Set([
      "deposit_paid",
      "deposit_confirmed",
      "preparation",
      "confirmed",
      "shot",
      "editing",
      "client_review",
      "delivered",
      "closed",
    ]);

    let status: string;
    if (b.booking_status === "cancelled" || b.enquiry_stage === "lost") {
      status = "cancelled";
    } else if (
      ["confirmed", "completed", "rescheduled", "shooting"].includes(b.booking_status) ||
      ["confirmed", "recorded"].includes(b.payment_status) ||
      confirmedStages.has(b.enquiry_stage)
    ) {
      status = b.booking_status === "completed" ? "completed" : "confirmed";
    } else if (b.payment_status === "reported" || b.enquiry_stage === "deposit_reported") {
      status = "reported";
    } else if (b.booking_status === "expired" || (b.booking_id && isHoldPastDue)) {
      status = "expired";
    } else {
      status = "awaiting_deposit";
    }

    const parsedSlot = b.shoot_start ? extractDateAndSlotWAT(b.shoot_start, answers) : null;

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
        shootDateFormatted: parsedSlot?.date || answers.selectedDate || null,
        shootTimeSlot: parsedSlot?.timeSlot || answers.timeSlot || null,
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
          depositAmount: b.deposit_amount || Math.round((b.total || 0) * ((b.deposit_percent || 70) / 100)),
          balanceAmount: b.balance_amount || Math.round((b.total || 0) * (1 - (b.deposit_percent || 70) / 100)),
          depositPercent: b.deposit_percent || 70,
          lineItems: typeof b.line_items === "string" ? JSON.parse(b.line_items) : b.line_items || [],
        },
        answers,
        payment: {
          id: b.payment_id,
          status: b.payment_status,
          receiptUrl: b.screenshot_asset_id,
          amountExpected: b.amount_expected,
          amountRecorded: b.amount_recorded,
          bankReference: b.bank_reference,
          aiCheck: typeof b.ai_check === "string" ? JSON.parse(b.ai_check) : b.ai_check || null,
        },
      },
    });
  } catch (err: any) {
    console.error("[booking GET error]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch booking" }, { status: 500 });
  }
}

// POST: create a new booking with atomic conflict & 20-hour hold enforcement
export async function POST(req: NextRequest) {
  try {
    // 0. Expire any stale 20-hour unpaid holds first so released slots can be booked
    await expireStaleHeldBookings(sql);

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
      answers: BookingAnswers & { selectedDate?: string; timeSlot?: string; packageName?: string };
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

    // Resolve date & slot whether passed at top-level or inside answers / shootStart
    let effectiveDate = selectedDate || answers?.selectedDate || "";
    let effectiveTimeSlot = timeSlot || answers?.timeSlot || "";

    if ((!effectiveDate || !effectiveTimeSlot) && explicitShootStart) {
      const m = explicitShootStart.trim().match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))$/i);
      if (m) {
        effectiveDate = effectiveDate || m[1];
        effectiveTimeSlot = effectiveTimeSlot || m[2].toUpperCase();
      }
    }

    // Enforce slot availability & 20-hour hold collision check
    if (effectiveDate && effectiveTimeSlot) {
      const conflictCheck = await checkSlotConflict(effectiveDate, effectiveTimeSlot);
      if (conflictCheck.conflict) {
        return NextResponse.json(
          { error: conflictCheck.reason || "This time slot is unavailable." },
          { status: 409 }
        );
      }
    }

    // Resolve canonical UTC shootStart & shootEnd timestamps anchored to WAT (+01:00)
    let shootStart: string | undefined;
    let shootEnd: string | undefined;

    if (effectiveDate && effectiveTimeSlot) {
      const timestamps = parseSlotToTimestampsWAT(effectiveDate, effectiveTimeSlot);
      shootStart = timestamps.start;
      shootEnd = timestamps.end;
    } else if (explicitShootStart) {
      const parsed = new Date(explicitShootStart);
      if (!isNaN(parsed.getTime())) {
        shootStart = parsed.toISOString();
        shootEnd = explicitShootEnd
          ? new Date(explicitShootEnd).toISOString()
          : new Date(parsed.getTime() + 90 * 60000).toISOString();
      }
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

    // 1. Calculate live estimate against Neon session overrides
    const [livePackages, liveSessions] = await Promise.all([
      getLivePackages(sessionType),
      getLiveSessionTypes(),
    ]);
    const estimate = calculateEstimate(
      sessionType,
      answers || {},
      answers?.packageId,
      livePackages,
      liveSessions[sessionType]
    );

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

    const normalizedAnswers = {
      ...answers,
      agreedPrice: estimate.total,
      ...(effectiveDate ? { selectedDate: effectiveDate } : {}),
      ...(effectiveTimeSlot ? { timeSlot: effectiveTimeSlot } : {}),
    };

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
        answers?.purpose || `${liveSessions[sessionType]?.title || sessionType} Session`,
        answers?.feeling || null,
        JSON.stringify(normalizedAnswers),
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

    // 5. Create held booking slot
    let bookingRecord = null;
    if (shootStart) {
      const locationType = answers?.locationType || "studio";
      const locationDetail =
        locationType === "studio" ? "LamSparks Private Abuja Studio" : "Client Location / Outdoor";

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
          shootEnd || new Date(new Date(shootStart).getTime() + 90 * 60000).toISOString(),
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

    const holdAnchor = bookingRecord
      ? new Date(bookingRecord.updated_at || bookingRecord.created_at).getTime()
      : Date.now();
    const holdExpiresAt = new Date(holdAnchor + HOLD_DURATION_MS).toISOString();

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

// PATCH: self-serve manage booking (reschedule, cancel, rehold expired hold, report_deposit)
export async function PATCH(req: NextRequest) {
  try {
    await expireStaleHeldBookings(sql);

    const body = await req.json();
    const { referenceCode, action, newDate, newTimeSlot, reason, receiptUrl } = body;

    if (!referenceCode) {
      return NextResponse.json({ error: "Reference code is required." }, { status: 400 });
    }

    const cleanRef = referenceCode.trim().toUpperCase();

    const enquiryRows = await sql.query(
      `SELECT e.id as enquiry_id, e.stage as enquiry_stage, e.answers,
              b.id as booking_id, b.status as booking_status, b.shoot_start, b.reschedule_count,
              p.status as payment_status
       FROM enquiry e
       LEFT JOIN booking b ON b.enquiry_id = e.id
       LEFT JOIN payment p ON p.enquiry_id = e.id AND p.kind = 'deposit'
       WHERE e.reference_code = $1
       ORDER BY b.created_at DESC NULLS LAST
       LIMIT 1`,
      [cleanRef]
    );

    if (enquiryRows.length === 0) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const row = enquiryRows[0];
    const { enquiry_id, booking_id, booking_status, payment_status, enquiry_stage } = row;
    const answers = typeof row.answers === "string" ? JSON.parse(row.answers) : row.answers || {};

    if (action === "reschedule") {
      if (!newDate || !newTimeSlot) {
        return NextResponse.json(
          { error: "newDate and newTimeSlot are required for rescheduling." },
          { status: 400 }
        );
      }

      // Check availability conflict before rescheduling
      const conflictCheck = await checkSlotConflict(newDate, newTimeSlot, enquiry_id);
      if (conflictCheck.conflict) {
        return NextResponse.json(
          { error: conflictCheck.reason || "Selected time slot is unavailable." },
          { status: 409 }
        );
      }

      const { start, end } = parseSlotToTimestampsWAT(newDate, newTimeSlot);
      const isAlreadyProtected =
        ["confirmed", "rescheduled", "completed", "shooting"].includes(booking_status) ||
        ["reported", "confirmed", "recorded"].includes(payment_status) ||
        ["deposit_reported", "deposit_paid", "preparation", "confirmed"].includes(enquiry_stage);

      const nextBookingStatus = isAlreadyProtected
        ? booking_status === "held"
          ? "held"
          : "rescheduled"
        : "held";

      if (booking_id) {
        await sql.query(
          `UPDATE booking 
           SET shoot_start = $1, 
               shoot_end = $2, 
               status = $3,
               reschedule_count = COALESCE(reschedule_count, 0) + 1, 
               updated_at = NOW() 
           WHERE id = $4`,
          [start, end, nextBookingStatus, booking_id]
        );
      } else {
        await sql.query(
          `INSERT INTO booking (
             id, enquiry_id, shoot_start, shoot_end, location_type, location_detail,
             status, reschedule_count, created_at, updated_at
           ) VALUES (
             gen_random_uuid(), $1, $2, $3, 'studio', 'LamSparks Private Abuja Studio',
             $4, 1, NOW(), NOW()
           )`,
          [enquiry_id, start, end, nextBookingStatus]
        );
      }

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

    if (action === "rehold") {
      if (!booking_id) {
        return NextResponse.json({ error: "No slot reservation found to re-hold." }, { status: 400 });
      }
      const { date, timeSlot } = extractDateAndSlotWAT(row.shoot_start, answers);
      if (!date || !timeSlot) {
        return NextResponse.json(
          { error: "Cannot determine the scheduled date and time slot for this reservation. Please choose a new slot from the calendar." },
          { status: 400 }
        );
      }

      // Check slot conflict against studio locks and any active reservations/holds by other clients
      const conflictCheck = await checkSlotConflict(date, timeSlot, enquiry_id);
      if (conflictCheck.conflict) {
        return NextResponse.json(
          {
            error:
              conflictCheck.reason ||
              `Sorry, ${timeSlot} on ${date} is already reserved by another client. Please select another open time slot.`,
          },
          { status: 409 }
        );
      }

      await sql.query(
        `UPDATE booking
         SET status = 'held',
             created_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [booking_id]
      );

      return NextResponse.json({
        success: true,
        message: "Slot temporarily re-reserved for 20 hours.",
        holdExpiresAt: new Date(Date.now() + HOLD_DURATION_MS).toISOString(),
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

      // Check if an expired unpaid hold lost its slot before reporting deposit
      if (booking_status === "expired" && row.shoot_start) {
        const { date, timeSlot } = extractDateAndSlotWAT(row.shoot_start, answers);
        const conflictCheck = await checkSlotConflict(date, timeSlot, enquiry_id);
        if (conflictCheck.conflict) {
          return NextResponse.json(
            {
              error:
                "Your 20-hour hold had expired and another client has since reserved this time slot. Please reschedule to an open time before submitting your deposit receipt.",
            },
            { status: 409 }
          );
        }
        // Reclaim the slot cleanly as held while verifying
        await sql.query(
          `UPDATE booking SET status = 'held', updated_at = NOW() WHERE id = $1`,
          [booking_id]
        );
      }

      const aiCheckData = body.aiCheck || {
        summary: "Receipt uploaded via Client Booking Self-Service. Pending staff bank verification.",
        reference: cleanRef,
        status: "pending_verification",
      };
      const amountExpected = body.amountExpected || 0;
      const amountRecorded = aiCheckData.extractedAmount || body.amountRecorded || null;
      const bankRef = aiCheckData.reference || body.bankReference || cleanRef;

      await sql.query(
        `INSERT INTO payment (
          id, enquiry_id, kind, status, screenshot_asset_id, amount_expected, amount_recorded, bank_reference, ai_check, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, 'deposit', 'reported', $2, $3, $4, $5, $6, NOW(), NOW()
        )`,
        [
          enquiry_id,
          receiptUrl,
          amountExpected,
          amountRecorded,
          bankRef,
          JSON.stringify(aiCheckData),
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
        aiCheck: aiCheckData,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("[booking PATCH error]", err);
    return NextResponse.json({ error: err.message || "Failed to update booking" }, { status: 500 });
  }
}
