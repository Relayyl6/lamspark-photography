import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET: return all enquiries from DB with their pipeline stages
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawEnquiries = await sql.query(`
      SELECT 
        e.id,
        e.reference_code,
        e.client_id,
        e.session_type,
        e.package_id,
        e.stage,
        e.waiting_on,
        e.stage_entered_at,
        e.source,
        e.source_detail,
        e.custom_quote,
        e.purpose_text,
        e.feeling_text,
        e.answers,
        e.created_at,
        e.updated_at,
        c.name as client_name,
        c.whatsapp_e164 as whatsapp,
        c.email as client_email,
        p.id as payment_id,
        p.amount_expected,
        p.amount_recorded,
        p.status as payment_status,
        p.screenshot_asset_id,
        p.bank_reference,
        p.recorded_by,
        p.recorded_at,
        p.ai_check,
        est.total as estimate_total,
        est.deposit_percent as estimate_deposit_percent,
        est.deposit_amount as estimate_deposit_amount,
        est.balance_amount as estimate_balance_amount
      FROM enquiry e
      LEFT JOIN client c ON e.client_id = c.id
      LEFT JOIN LATERAL (
        SELECT total, deposit_percent, deposit_amount, balance_amount
        FROM estimate_snapshot
        WHERE estimate_snapshot.enquiry_id = e.id
        ORDER BY created_at DESC LIMIT 1
      ) est ON true
      LEFT JOIN LATERAL (
        SELECT id, amount_expected, amount_recorded, status, screenshot_asset_id, bank_reference, recorded_by, recorded_at, ai_check
        FROM payment 
        WHERE payment.enquiry_id = e.id AND payment.kind = 'deposit'
        ORDER BY created_at DESC LIMIT 1
      ) p ON true
      ORDER BY e.created_at DESC
    `);

    const enquiries = rawEnquiries.map((e: any) => {
      const answers = typeof e.answers === "string" ? JSON.parse(e.answers) : (e.answers || {});
      const depositPercent =
        Number(e.estimate_deposit_percent) ||
        (e.session_type === "maternity" || e.session_type === "motherhood-bundle" ? 50 : 70);
      const agreedPrice =
        e.estimate_total != null
          ? Number(e.estimate_total)
          : answers.agreedPrice ||
            (e.amount_expected ? Math.round(Number(e.amount_expected) / (depositPercent / 100)) : 0);
      const depositAmount =
        e.estimate_deposit_amount != null
          ? Number(e.estimate_deposit_amount)
          : e.amount_expected
          ? Number(e.amount_expected)
          : Math.round(agreedPrice * (depositPercent / 100));
      const balanceAmount =
        e.estimate_balance_amount != null
          ? Number(e.estimate_balance_amount)
          : Math.max(0, agreedPrice - depositAmount);

      return {
        id: e.id,
        reference_code: e.reference_code,
        client_id: e.client_id,
        client_name: e.client_name,
        whatsapp: e.whatsapp,
        client_email: e.client_email,
        session_type: e.session_type,
        package_id: e.package_id,
        stage: e.stage,
        waiting_on: e.waiting_on,
        stage_entered_at: e.stage_entered_at,
        source: e.source,
        source_detail: e.source_detail,
        custom_quote: e.custom_quote,
        purpose_text: e.purpose_text,
        feeling_text: e.feeling_text,
        answers: answers,
        agreed_price: agreedPrice,
        deposit_percent: depositPercent,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        deposit_screenshot_url: e.screenshot_asset_id,
        deposit_paid_at: e.recorded_at,
        deposit_recorded_by: e.recorded_by,
        bank_reference: e.bank_reference,
        payment: e.payment_id ? {
          id: e.payment_id,
          amountExpected: e.amount_expected,
          amountRecorded: e.amount_recorded,
          status: e.payment_status,
          bankReference: e.bank_reference,
          aiCheck: e.ai_check,
        } : undefined,
        created_at: e.created_at,
        updated_at: e.updated_at,
      };
    });

    return NextResponse.json({ enquiries });
  } catch (err: any) {
    console.error("[kanban GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: update enquiry stage { id, stage }
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, stage, waitingOn } = body;

    if (!id || !stage) {
      return NextResponse.json({ error: "id and stage are required" }, { status: 400 });
    }

    const result = await sql.query(
      `UPDATE enquiry
       SET 
         stage = $1,
         waiting_on = COALESCE($2, waiting_on),
         stage_entered_at = NOW(),
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [stage, waitingOn || null, id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ enquiry: result[0] });
  } catch (err: any) {
    console.error("[kanban PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create new enquiry card
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      clientName,
      whatsapp,
      email,
      sessionType,
      stage,
      purposeText,
      source,
    } = body;

    if (!clientName || !whatsapp) {
      return NextResponse.json({ error: "clientName and whatsapp are required" }, { status: 400 });
    }

    // 1. Ensure client exists or create
    let clientId: string;
    const existingClient = await sql.query(
      `SELECT id FROM client WHERE whatsapp_e164 = $1 LIMIT 1`,
      [whatsapp]
    );

    if (existingClient.length > 0) {
      clientId = existingClient[0].id;
    } else {
      const newClient = await sql.query(
        `INSERT INTO client (id, name, whatsapp_e164, email, source_first, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [clientName, whatsapp, email || null, source || "Studio Admin"]
      );
      clientId = newClient[0].id;
    }

    // 2. Generate reference code
    const randCode = "LS-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    // 3. Insert enquiry
    const newEnquiry = await sql.query(
      `INSERT INTO enquiry (
         id, client_id, session_type, stage, waiting_on, 
         stage_entered_at, source, reference_code, purpose_text, 
         created_at, updated_at
       )
       VALUES (
         gen_random_uuid(), $1, $2, $3, 'us',
         NOW(), $4, $5, $6,
         NOW(), NOW()
       )
       RETURNING *`,
      [
        clientId,
        sessionType || "toddler",
        stage || "deposit_reported",
        source || "Studio Admin",
        randCode,
        purposeText || "Studio Concierge Lead",
      ]
    );

    return NextResponse.json({ enquiry: newEnquiry[0] }, { status: 201 });
  } catch (err: any) {
    console.error("[kanban POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: delete an enquiry and its associated records (payment, booking, estimate_snapshot)
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
      return NextResponse.json({ error: "id or ref parameter is required" }, { status: 400 });
    }

    // Find the enquiry first
    let enquiryRow: { id: string; reference_code: string } | undefined;
    if (id) {
      const rows = (await sql.query(
        `SELECT id, reference_code FROM enquiry WHERE id = $1 LIMIT 1`,
        [id]
      )) as { id: string; reference_code: string }[];
      enquiryRow = rows[0];
    } else if (ref) {
      const rows = (await sql.query(
        `SELECT id, reference_code FROM enquiry WHERE reference_code = $1 LIMIT 1`,
        [ref]
      )) as { id: string; reference_code: string }[];
      enquiryRow = rows[0];
    }

    if (!enquiryRow) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const targetId = enquiryRow.id;

    // Delete dependent records safely
    await sql.query(`DELETE FROM payment WHERE enquiry_id = $1`, [targetId]);
    await sql.query(`DELETE FROM booking WHERE enquiry_id = $1`, [targetId]);
    await sql.query(`DELETE FROM estimate_snapshot WHERE enquiry_id = $1`, [targetId]);

    try {
      await sql.query(`DELETE FROM conversation WHERE enquiry_id = $1`, [targetId]);
    } catch (_) {}

    // Delete enquiry itself
    await sql.query(`DELETE FROM enquiry WHERE id = $1`, [targetId]);

    return NextResponse.json({
      success: true,
      message: `Enquiry ${enquiryRow.reference_code} deleted successfully`,
      deletedId: targetId,
      referenceCode: enquiryRow.reference_code,
    });
  } catch (err: any) {
    console.error("[kanban DELETE]", err);
    return NextResponse.json({ error: err.message || "Failed to delete enquiry" }, { status: 500 });
  }
}

