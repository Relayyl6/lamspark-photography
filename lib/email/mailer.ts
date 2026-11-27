import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";
import { extractDateAndSlotWAT, HOLD_DURATION_MS } from "@/lib/booking-hold";
import { SESSION_TYPES } from "@/lib/catalog/seed";
import { getSiteUrl } from "@/lib/metadata";
import { buildBookingIcs } from "./ics";
import { buildPrintableDocumentPage } from "./documents";
import { renderBookingEmail, wrapOwnerCopyHtml } from "./templates";
import type { BookingEmailContext, EmailPipelineEvent } from "./types";
import { STUDIO_BUSINESS_INFO } from "./types";
import type { SessionTypeSlug } from "@/lib/types";

let cachedTransporter: Transporter | null = null;

function getTransporter(): { transporter: Transporter; user: string } | null {
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();

  if (!user || !pass) {
    console.warn("[Email Pipeline] SMTP_USER or SMTP_PASS is missing; skipping email dispatch.");
    return null;
  }

  if (!cachedTransporter) {
    const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
    const port = Number(process.env.SMTP_PORT || 465);
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return { transporter: cachedTransporter, user };
}

function getOwnerNotifyEmails(): string[] {
  const raw =
    process.env.STUDIO_OWNER_NOTIFY_EMAIL ||
    STUDIO_BUSINESS_INFO.email ||
    process.env.STUDIO_OWNER_EMAIL ||
    "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => Boolean(e) && e.includes("@"));
}

/**
 * Loads full unified client, booking, estimate, and payment context from Neon Postgres
 * by either enquiryId, bookingId, or referenceCode.
 */
export async function loadBookingEmailContext(
  sql: any,
  lookup: { enquiryId?: string; bookingId?: string; referenceCode?: string }
): Promise<BookingEmailContext | null> {
  try {
    let whereClause = "";
    let param = "";

    if (lookup.enquiryId) {
      whereClause = "e.id::text = $1";
      param = lookup.enquiryId;
    } else if (lookup.bookingId) {
      whereClause = "b.id::text = $1";
      param = lookup.bookingId;
    } else if (lookup.referenceCode) {
      whereClause = "e.reference_code = $1";
      param = lookup.referenceCode.trim().toUpperCase();
    } else {
      return null;
    }

    const rows = await sql.query(
      `SELECT
         e.id as enquiry_id,
         e.reference_code,
         e.session_type,
         e.stage,
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
         p.status as payment_status,
         p.amount_expected,
         p.amount_recorded,
         p.bank_reference,
         p.recorded_by,
         p.recorded_at,
         es.total as estimate_total,
         es.deposit_percent as estimate_deposit_percent,
         es.deposit_amount as estimate_deposit_amount,
         es.balance_amount as estimate_balance_amount,
         es.line_items
       FROM enquiry e
       JOIN client c ON e.client_id = c.id
       LEFT JOIN booking b ON b.enquiry_id = e.id
       LEFT JOIN LATERAL (
         SELECT id, status, amount_expected, amount_recorded, bank_reference, recorded_by, recorded_at
         FROM payment
         WHERE payment.enquiry_id = e.id AND payment.kind = 'deposit'
         ORDER BY created_at DESC LIMIT 1
       ) p ON true
       LEFT JOIN LATERAL (
         SELECT total, deposit_percent, deposit_amount, balance_amount, line_items
         FROM estimate_snapshot
         WHERE estimate_snapshot.enquiry_id = e.id
         ORDER BY created_at DESC LIMIT 1
       ) es ON true
       WHERE ${whereClause}
       ORDER BY b.created_at DESC NULLS LAST
       LIMIT 1`,
      [param]
    );

    if (!rows || rows.length === 0) return null;

    const r = rows[0];
    const answers = typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers || {};
    const parsedSlot = r.shoot_start ? extractDateAndSlotWAT(r.shoot_start, answers) : null;

    const holdAnchor = new Date(
      r.booking_updated_at || r.booking_created_at || r.enquiry_created_at
    ).getTime();

    const sessionMeta = SESSION_TYPES[r.session_type as SessionTypeSlug];
    const sessionTitle = sessionMeta?.title || String(r.session_type || "Portrait Session");

    const depositPercent = Number(r.estimate_deposit_percent) || (r.session_type === "maternity" || r.session_type === "motherhood-bundle" ? 50 : 70);
    const total = Number(r.estimate_total ?? answers.agreedPrice ?? 0);
    const depositAmount =
      r.estimate_deposit_amount != null
        ? Number(r.estimate_deposit_amount)
        : Number(r.amount_expected || Math.round(total * (depositPercent / 100)));
    const balanceAmount =
      r.estimate_balance_amount != null
        ? Number(r.estimate_balance_amount)
        : Math.max(0, total - depositAmount);

    const rawLineItems =
      typeof r.line_items === "string" ? JSON.parse(r.line_items) : r.line_items || [];

    return {
      enquiryId: r.enquiry_id,
      referenceCode: r.reference_code,
      sessionType: r.session_type,
      sessionTitle,
      stage: r.stage || "enquiry",
      bookingStatus: r.booking_status || "held",
      shootStart: r.shoot_start ? new Date(r.shoot_start).toISOString() : null,
      shootEnd: r.shoot_end ? new Date(r.shoot_end).toISOString() : null,
      shootDateFormatted: parsedSlot?.date || answers.selectedDate || null,
      shootTimeSlot: parsedSlot?.timeSlot || answers.timeSlot || null,
      rescheduleCount: Number(r.reschedule_count || 0),
      locationType: r.location_type || answers.locationType || "studio",
      locationDetail: r.location_detail || STUDIO_BUSINESS_INFO.location,
      holdExpiresAt:
        r.booking_status === "held" ? new Date(holdAnchor + HOLD_DURATION_MS).toISOString() : null,
      closedReason: r.closed_reason || null,
      purposeText: r.purpose_text || answers.purpose || null,
      feelingText: r.feeling_text || answers.feeling || null,
      createdAt: r.enquiry_created_at,
      client: {
        id: r.client_id,
        name: r.client_name,
        email: r.client_email ? String(r.client_email).trim() : null,
        whatsapp: r.whatsapp,
      },
      answers,
      estimate: {
        total,
        depositPercent,
        depositAmount,
        balanceAmount,
        lineItems: Array.isArray(rawLineItems) ? rawLineItems : [],
      },
      payment: {
        id: r.payment_id || null,
        status: r.payment_status || null,
        amountExpected: Number(r.amount_expected || depositAmount || 0),
        amountRecorded: Number(r.amount_recorded || r.amount_expected || depositAmount || 0),
        bankReference: r.bank_reference || null,
        recordedBy: r.recorded_by || null,
        recordedAt: r.recorded_at ? new Date(r.recorded_at).toISOString() : null,
      },
    };
  } catch (err) {
    console.error("[Email Context Load Error]", err);
    return null;
  }
}

/**
 * Dispatches tailored transactional emails + optional .ics calendar invite + optional printable
 * Invoice / Official Receipt to BOTH the client (when provided) AND the studio owner email(s).
 */
export async function dispatchBookingEmail(
  sql: any,
  event: EmailPipelineEvent,
  lookup: { enquiryId?: string; bookingId?: string; referenceCode?: string },
  options?: { oldDateLabel?: string }
): Promise<{ sentToClient: boolean; sentToOwner: boolean }> {
  const result = { sentToClient: false, sentToOwner: false };

  try {
    const smtp = getTransporter();
    if (!smtp) return result;

    const ctx = await loadBookingEmailContext(sql, lookup);
    if (!ctx) return result;

    const fromName = (process.env.SMTP_FROM_NAME || STUDIO_BUSINESS_INFO.name).trim();
    const fromHeader = `"${fromName}" <${smtp.user}>`;
    const replyTo = STUDIO_BUSINESS_INFO.email;
    const siteUrl = getSiteUrl();
    const bookingUrl = `${siteUrl}/book?ref=${encodeURIComponent(ctx.referenceCode)}`;

    const rendered = renderBookingEmail(event, ctx, options);

    const attachments: SendMailOptions["attachments"] = [];
    if (rendered.icsMethod) {
      const icsContent = buildBookingIcs(ctx, {
        method: rendered.icsMethod,
        bookingUrl,
        senderEmail: smtp.user,
      });
      if (icsContent) {
        attachments.push({
          filename: `lamsparks-${ctx.referenceCode.toLowerCase()}.ics`,
          content: icsContent,
          contentType: `text/calendar; charset=utf-8; method=${rendered.icsMethod}`,
        });
      }
    }

    if (rendered.attachmentDoc) {
      const printablePage = buildPrintableDocumentPage(ctx, rendered.attachmentDoc.kind);
      attachments.push({
        filename: rendered.attachmentDoc.filename,
        content: printablePage,
        contentType: "text/html; charset=utf-8",
      });
    }

    // 1. Send to Client (if they entered a valid email in the booking flow)
    const clientEmail = ctx.client.email;
    if (clientEmail && clientEmail.includes("@")) {
      try {
        await smtp.transporter.sendMail({
          from: fromHeader,
          to: clientEmail,
          replyTo,
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
          attachments,
        });
        result.sentToClient = true;
        console.log(`[Email Pipeline] Sent "${event}" to client ${clientEmail} (${ctx.referenceCode})`);
      } catch (clientErr) {
        console.error(`[Email Pipeline] Failed sending "${event}" to client ${clientEmail}:`, clientErr);
      }
    }

    // 2. Send Owner Copy (with quick Studio Kanban + Client summary banner)
    const ownerEmails = getOwnerNotifyEmails().filter(
      (addr) => addr.toLowerCase() !== (clientEmail || "").toLowerCase()
    );
    if (ownerEmails.length > 0) {
      try {
        const ownerHtml = wrapOwnerCopyHtml(rendered.html, event, ctx);
        await smtp.transporter.sendMail({
          from: fromHeader,
          to: ownerEmails.join(", "),
          replyTo: clientEmail || replyTo,
          subject: `[Studio Alert] ${rendered.subject} — ${ctx.client.name}`,
          text: `STUDIO OWNER NOTIFICATION (${event})\nClient: ${ctx.client.name} (${ctx.client.whatsapp} / ${ctx.client.email || "no email"})\n\n${rendered.text}`,
          html: ownerHtml,
          attachments,
        });
        result.sentToOwner = true;
        console.log(`[Email Pipeline] Sent "${event}" owner copy to ${ownerEmails.join(", ")} (${ctx.referenceCode})`);
      } catch (ownerErr) {
        console.error(`[Email Pipeline] Failed sending "${event}" owner alert:`, ownerErr);
      }
    }

    return result;
  } catch (err) {
    console.error("[Email Pipeline Dispatch Error]", err);
    return result;
  }
}
