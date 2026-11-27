import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";
import { verifyDepositAccounting } from "@/lib/ai/service";
import { dispatchBookingEmail } from "@/lib/email/mailer";

const sql = neon(process.env.DATABASE_URL!);

// GET: fetch pending deposit queue
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawDeposits = await sql.query(`
      SELECT 
        e.id,
        e.reference_code,
        e.client_id,
        e.session_type,
        e.stage,
        e.purpose_text,
        e.feeling_text,
        e.answers,
        e.created_at,
        c.name as client_name,
        c.whatsapp_e164 as whatsapp,
        c.email as client_email,
        p.id as payment_id,
        p.amount_expected,
        p.amount_recorded,
        p.status as payment_status,
        p.screenshot_asset_id as deposit_screenshot_url,
        p.bank_reference,
        p.recorded_by,
        p.recorded_at,
        p.ai_check
      FROM enquiry e
      JOIN client c ON e.client_id = c.id
      JOIN payment p ON p.enquiry_id = e.id AND p.kind = 'deposit'
      WHERE e.stage = 'deposit_reported' OR p.status = 'reported'
      ORDER BY p.created_at DESC
    `);

    const deposits = rawDeposits.map((d: any) => {
      const answers = typeof d.answers === "string" ? JSON.parse(d.answers) : (d.answers || {});
      const agreedPrice = answers.agreedPrice || (d.amount_expected ? Math.round(d.amount_expected / 0.7) : 0);
      const parsedAiCheck = typeof d.ai_check === "string" ? JSON.parse(d.ai_check) : d.ai_check;
      const accountingCheck = verifyDepositAccounting(
        parsedAiCheck || {},
        d.amount_expected || 0,
        agreedPrice
      );

      return {
        id: d.id,
        reference_code: d.reference_code,
        client_id: d.client_id,
        client_name: d.client_name,
        whatsapp: d.whatsapp,
        client_email: d.client_email,
        session_type: d.session_type,
        stage: d.stage,
        purpose_text: d.purpose_text,
        agreed_price: agreedPrice,
        deposit_screenshot_url: d.deposit_screenshot_url,
        payment: {
          id: d.payment_id,
          amountExpected: d.amount_expected,
          amountRecorded: d.amount_recorded,
          status: d.payment_status,
          bankReference: d.bank_reference,
          aiCheck: parsedAiCheck,
          accountingCheck,
        },
        created_at: d.created_at,
      };
    });

    return NextResponse.json({ deposits });
  } catch (err: any) {
    console.error("[deposits GET error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: verify & record or reject deposit
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { enquiryId, action, bankReference, amountRecorded, reason } = body;

    if (!enquiryId || !action) {
      return NextResponse.json({ error: "enquiryId and action are required" }, { status: 400 });
    }

    if (action === "verify") {
      if (!bankReference?.trim()) {
        return NextResponse.json({ error: "bankReference is required to verify deposit" }, { status: 400 });
      }

      // 1. Update Payment
      await sql.query(
        `UPDATE payment
         SET 
           status = 'recorded',
           bank_reference = $1,
           amount_recorded = COALESCE($2, amount_expected),
           recorded_by = $3,
           recorded_at = NOW(),
           updated_at = NOW()
         WHERE enquiry_id = $4 AND kind = 'deposit'`,
        [bankReference.trim(), amountRecorded || null, admin.name, enquiryId]
      );

      // 2. Advance Enquiry Stage to 'deposit_paid'
      const updatedEnquiry = await sql.query(
        `UPDATE enquiry
         SET 
           stage = 'deposit_paid',
           waiting_on = 'us',
           stage_entered_at = NOW(),
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [enquiryId]
      );

      // 3. Confirm existing held/pending booking row or create fallback if none exists
      const updatedBooking = await sql.query(
        `UPDATE booking
         SET status = 'confirmed',
             updated_at = NOW()
         WHERE enquiry_id = $1 AND status != 'cancelled'
         RETURNING id`,
        [enquiryId]
      );

      if (updatedBooking.length === 0) {
        await sql.query(
          `INSERT INTO booking (
             id, enquiry_id, shoot_start, shoot_end, location_type, status, created_at, updated_at
           )
           VALUES (
             gen_random_uuid(), $1, NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours', 'studio', 'confirmed', NOW(), NOW()
           )`,
          [enquiryId]
        );
      }

      // Send Deposit Confirmed + Crisp Invoice email to Client & Studio Owner
      await dispatchBookingEmail(sql, "deposit_confirmed", { enquiryId });

      return NextResponse.json({
        success: true,
        message: `Deposit verified & recorded with bank reference ${bankReference}. Moved to Deposit Confirmed.`,
        enquiry: updatedEnquiry[0],
      });
    } else if (action === "reject") {
      // Reject payment
      await sql.query(
        `UPDATE payment
         SET 
           status = 'rejected',
           updated_at = NOW()
         WHERE enquiry_id = $1 AND kind = 'deposit'`,
        [enquiryId]
      );

      // Revert enquiry stage to 'agreed_to_price'
      const updatedEnquiry = await sql.query(
        `UPDATE enquiry
         SET 
           stage = 'agreed_to_price',
           waiting_on = 'client',
           stage_entered_at = NOW(),
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [enquiryId]
      );

      await dispatchBookingEmail(sql, "stage_updated", { enquiryId });

      return NextResponse.json({
        success: true,
        message: `Deposit rejected: ${reason || "Unverified bank transfer"}. Moved to Agreed to Price.`,
        enquiry: updatedEnquiry[0],
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[deposits PUT error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
