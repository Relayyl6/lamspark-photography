import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { calculateEstimate } from "@/lib/estimate/engine";
import { BookingAnswers, SessionTypeSlug } from "@/lib/types";

const sql = neon(process.env.DATABASE_URL!);

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
        JSON.stringify({ ...answers, agreedPrice: estimate.total }),
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

    // 5. If receipt was uploaded, insert payment record
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

    return NextResponse.json(
      {
        success: true,
        referenceCode: refCode,
        client,
        enquiry,
        estimate,
        payment: paymentRecord,
        stage: initialStage,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[booking POST error]", err);
    return NextResponse.json({ error: err.message || "Failed to submit booking" }, { status: 500 });
  }
}
