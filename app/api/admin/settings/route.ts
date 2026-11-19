import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Read optional DB overrides for meta credentials
    const rows = await sql.query(
      `SELECT value FROM site_content WHERE key = 'meta_api_credentials' LIMIT 1`
    ).catch(() => []);

    const dbMeta = rows[0]?.value || {};

    const waPhoneId = dbMeta.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    const waToken = dbMeta.whatsapp_access_token || process.env.WHATSAPP_ACCESS_TOKEN || "";
    const igAccountId = dbMeta.instagram_account_id || process.env.INSTAGRAM_ACCOUNT_ID || "";
    const igToken = dbMeta.instagram_access_token || process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || "";
    const verifyToken = dbMeta.webhook_verify_token || process.env.WHATSAPP_VERIFY_TOKEN || "lamsparks_secure_token_2026";

    return NextResponse.json({
      bankDetails: {
        bankName: process.env.BANK_NAME || "PalmPay",
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || "9064982841",
        accountName: process.env.BANK_ACCOUNT_NAME || "LEONARD OSEGHALE OSELUMHENSE",
      },
      adminEmail: process.env.STUDIO_OWNER_EMAIL || "osemene@lamsparks.com",
      adminName: process.env.STUDIO_OWNER_NAME || "Osemene (Studio Owner)",
      cloudinaryConfigured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
      metaCredentials: {
        whatsappPhoneNumberId: waPhoneId,
        hasWhatsappToken: Boolean(waToken),
        instagramAccountId: igAccountId,
        hasInstagramToken: Boolean(igToken),
        webhookVerifyToken: verifyToken,
      },
      webhookEndpoints: {
        whatsappWebhookUrl: "/api/webhooks/whatsapp",
        instagramWebhookUrl: "/api/webhooks/instagram",
      },
    });
  } catch (err: any) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      whatsappPhoneNumberId,
      whatsappAccessToken,
      instagramAccountId,
      instagramAccessToken,
      webhookVerifyToken,
    } = body;

    const credentials = {
      whatsapp_phone_number_id: whatsappPhoneNumberId?.trim() || null,
      whatsapp_access_token: whatsappAccessToken?.trim() || null,
      instagram_account_id: instagramAccountId?.trim() || null,
      instagram_access_token: instagramAccessToken?.trim() || null,
      webhook_verify_token: webhookVerifyToken?.trim() || "lamsparks_secure_token_2026",
    };

    await sql.query(
      `INSERT INTO site_content (key, value, updated_at)
       VALUES ('meta_api_credentials', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [JSON.stringify(credentials)]
    );

    return NextResponse.json({ success: true, credentials });
  } catch (err: any) {
    console.error("[settings PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
