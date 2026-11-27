import type { BookingEmailContext, EmailPipelineEvent } from "./types";
import { STUDIO_BUSINESS_INFO } from "./types";
import { buildCrispFinancialDocumentInner, formatReadableDateWAT } from "./documents";
import { getSiteUrl } from "@/lib/metadata";

function esc(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNaira(amount: number | null | undefined): string {
  const num = Number(amount) || 0;
  return `&#8358;${num.toLocaleString("en-NG")}`;
}

export interface RenderedEmailContent {
  subject: string;
  html: string;
  text: string;
  icsMethod?: "REQUEST" | "CANCEL";
  attachmentDoc?: {
    filename: string;
    html: string;
    kind: "invoice" | "receipt";
  };
}

const KANBAN_STAGE_COPY: Record<
  string,
  { eyebrow: string; headlinePrefix: string; headlineAccent: string; message: string; subjectVerb: string }
> = {
  enquiry: {
    eyebrow: "ENQUIRY LOGGED",
    headlinePrefix: "WE RECEIVED YOUR ",
    headlineAccent: "ENQUIRY.",
    message:
      "Thank you for reaching out to LamSparks Photography. Osemene and the studio concierge are reviewing your preferences and will follow up promptly.",
    subjectVerb: "Session enquiry received",
  },
  agreed_to_price: {
    eyebrow: "ESTIMATE AGREED",
    headlinePrefix: "YOUR QUOTE IS ",
    headlineAccent: "READY.",
    message:
      "Your session scope and investment estimate have been confirmed. Complete your deposit transfer and upload your receipt on your booking portal to lock your shoot date.",
    subjectVerb: "Session quote agreed",
  },
  deposit_reported: {
    eyebrow: "RECEIPT IN REVIEW",
    headlinePrefix: "WE RECEIVED YOUR ",
    headlineAccent: "RECEIPT.",
    message:
      "Thank you for uploading your transfer proof. Our concierge team is verifying the credit with Fidelity Bank and will send your confirmed invoice shortly.",
    subjectVerb: "Deposit receipt received",
  },
  deposit_paid: {
    eyebrow: "DEPOSIT CONFIRMED",
    headlinePrefix: "YOUR SLOT IS ",
    headlineAccent: "LOCKED.",
    message:
      "Your deposit has been verified and your shoot date is officially secured on Osemene's private Abuja calendar. Your official invoice is attached below.",
    subjectVerb: "Deposit confirmed & invoice",
  },
  preparation: {
    eyebrow: "PREP & STYLING",
    headlinePrefix: "TIME FOR ",
    headlineAccent: "WARDROBE PREP.",
    message:
      "Your session is now in our Wardrobe & Styling Prep phase. Review your outfit count, arrival guidelines, and session notes via your booking link ahead of shoot day.",
    subjectVerb: "Wardrobe & styling prep ready",
  },
  confirmed: {
    eyebrow: "CONFIRMED SHOOT",
    headlinePrefix: "YOUR SESSION IS ",
    headlineAccent: "CONFIRMED.",
    message:
      "Everything is finalized on Osemene's schedule in Maitama, Abuja. We look forward to creating unhurried, timeless frames with you.",
    subjectVerb: "Session confirmed on studio calendar",
  },
  shot: {
    eyebrow: "FRAMES CAPTURED",
    headlinePrefix: "THAT WAS A ",
    headlineAccent: "WRAP.",
    message:
      "What an honour photographing with you today. Your raw frames have been securely backed up into our Maitama editing suite for curation.",
    subjectVerb: "Shoot wrapped & frames backed up",
  },
  editing: {
    eyebrow: "MASTER RETOUCHING",
    headlinePrefix: "FINE-ART GRADING ",
    headlineAccent: "UNDERWAY.",
    message:
      "Osemene is hand-grading tones, gentle skin fidelity, and archival colour contrast on your curated selections.",
    subjectVerb: "Fine-art editing in progress",
  },
  client_review: {
    eyebrow: "CLIENT REVEAL",
    headlinePrefix: "YOUR GALLERY IS ",
    headlineAccent: "READY TO VIEW.",
    message:
      "Your preview collection is ready for review. Please check in via your booking portal or WhatsApp so we can wrap up final deliverables.",
    subjectVerb: "Gallery ready for your review",
  },
  delivered: {
    eyebrow: "GALLERY DELIVERED",
    headlinePrefix: "YOUR HEIRLOOMS ",
    headlineAccent: "HAVE ARRIVED.",
    message:
      "Your final retouched collection has been delivered and your session is complete. Thank you for trusting LamSparks — your official receipt is included below.",
    subjectVerb: "Final gallery delivered & official receipt",
  },
  closed: {
    eyebrow: "SESSION COMPLETED",
    headlinePrefix: "THANK YOU FOR ",
    headlineAccent: "CHOOSING LAMSPARKS.",
    message:
      "Your LamSparks session has been completed and archived safely. Your official receipt is included below for your records.",
    subjectVerb: "Session completed & official receipt",
  },
};

function renderBookingSummaryCard(ctx: BookingEmailContext): string {
  const siteUrl = getSiteUrl();
  const bookingUrl = `${siteUrl}/book?ref=${encodeURIComponent(ctx.referenceCode)}`;
  const dateLabel = formatReadableDateWAT(ctx.shootDateFormatted || ctx.answers?.selectedDate);
  const timeLabel = ctx.shootTimeSlot || ctx.answers?.timeSlot || "To be finalized";

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#FFFFFF;border:1px solid #E5DECF;border-radius:14px;margin:20px 0;">
    <tr>
      <td style="padding:16px 18px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#B8893A;margin-bottom:10px;">
          SESSION OVERVIEW · REF ${esc(ctx.referenceCode)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px;color:#3A312A;line-height:1.65;">
          <tr>
            <td style="padding:3px 0;color:#7A6E63;width:36%;">Client</td>
            <td style="padding:3px 0;font-weight:600;color:#1A1410;">${esc(ctx.client.name)}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#7A6E63;">Session</td>
            <td style="padding:3px 0;font-weight:600;color:#1A1410;">${esc(ctx.sessionTitle)}${ctx.answers?.packageName ? ` (${esc(ctx.answers.packageName)})` : ""}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#7A6E63;">Scheduled Date</td>
            <td style="padding:3px 0;font-weight:600;color:#1A1410;">${esc(dateLabel)}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#7A6E63;">Time Slot</td>
            <td style="padding:3px 0;font-weight:600;color:#1A1410;">${esc(timeLabel)} (WAT)</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#7A6E63;">Location</td>
            <td style="padding:3px 0;font-weight:600;color:#1A1410;">${esc(ctx.locationDetail || STUDIO_BUSINESS_INFO.location)}</td>
          </tr>
          ${
            ctx.answers?.outfitCount
              ? `<tr><td style="padding:3px 0;color:#7A6E63;">Wardrobe</td><td style="padding:3px 0;font-weight:600;color:#1A1410;">${esc(ctx.answers.outfitCount)} outfit(s)</td></tr>`
              : ""
          }
          ${
            ctx.estimate.total > 0
              ? `<tr><td style="padding:3px 0;color:#7A6E63;">Total Investment</td><td style="padding:3px 0;font-weight:700;color:#1A1410;">${formatNaira(ctx.estimate.total)}</td></tr>
                 <tr><td style="padding:3px 0;color:#7A6E63;">Required Deposit (${ctx.estimate.depositPercent}%)</td><td style="padding:3px 0;font-weight:700;color:#B8893A;">${formatNaira(ctx.estimate.depositAmount)}</td></tr>`
              : ""
          }
          ${
            ctx.answers?.notes
              ? `<tr><td style="padding:3px 0;color:#7A6E63;vertical-align:top;">Notes</td><td style="padding:3px 0;color:#4B4036;">${esc(ctx.answers.notes)}</td></tr>`
              : ""
          }
        </table>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid #EFEAE0;font-size:12px;">
          <a href="${esc(bookingUrl)}" style="color:#B8893A;font-weight:700;text-decoration:underline;">Booking Link: ${esc(bookingUrl)}</a>
        </div>
      </td>
    </tr>
  </table>`;
}

function wrapAtelierEmail({
  eyebrow,
  headlinePrefix,
  headlineAccent,
  introText,
  ctx,
  ctaLabel,
  ctaHref,
  extraHtml = "",
  bankNotice = false,
}: {
  eyebrow: string;
  headlinePrefix: string;
  headlineAccent: string;
  introText: string;
  ctx: BookingEmailContext;
  ctaLabel: string;
  ctaHref: string;
  extraHtml?: string;
  bankNotice?: boolean;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:24px 12px;background:#F4EFE6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A1410;">
  <div style="max-width:640px;margin:0 auto;">
    <!-- Top Brand Mark -->
    <div style="padding:4px 6px 16px 6px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#1A1410;letter-spacing:-0.02em;">LAMSPARKS</span><span style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#C9A96E;">.</span>
      <span style="display:block;font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#7A6E63;margin-top:2px;">
        PRIVATE PORTRAIT &amp; EVENT STUDIO · ABUJA
      </span>
    </div>

    <!-- Main Warm Ivory Card -->
    <div style="background:#FAF7F2;border:1px solid #E5DECF;border-radius:20px;padding:30px 26px;box-shadow:0 8px 28px rgba(26,20,16,0.05);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#B8893A;margin-bottom:10px;">
        ${esc(eyebrow)} · REF ${esc(ctx.referenceCode)}
      </div>

      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.12;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;color:#1A1410;">
        ${esc(headlinePrefix)}<span style="color:#B8893A;">${esc(headlineAccent)}</span>
      </h1>

      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.62;color:#3E352D;">
        ${esc(introText)}
      </p>

      ${renderBookingSummaryCard(ctx)}

      ${
        bankNotice && ctx.estimate.depositAmount > 0
          ? `<div style="background:#FFFBF0;border:1px solid #E8D5AA;border-radius:12px;padding:14px 16px;margin:16px 0;font-size:13px;line-height:1.6;color:#3E352D;">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#B45309;margin-bottom:4px;">
                STUDIO DEPOSIT DETAILS (20-HOUR HOLD)
              </div>
              Transfer <strong>${formatNaira(ctx.estimate.depositAmount)}</strong> to:<br/>
              <strong>${esc(STUDIO_BUSINESS_INFO.bankName)}</strong> · Account <strong>${esc(STUDIO_BUSINESS_INFO.accountNumber)}</strong> · <strong>${esc(STUDIO_BUSINESS_INFO.accountName)}</strong><br/>
              Then upload your receipt via your booking link below to confirm your date immediately.
            </div>`
          : ""
      }

      <!-- Primary Action Pill -->
      <div style="margin:22px 0 18px 0;">
        <a href="${esc(ctaHref)}" style="display:inline-block;background:#C9A96E;color:#1A1410;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:14px 26px;border-radius:999px;">
          ${esc(ctaLabel)} &rarr;
        </a>
      </div>

      <p style="margin:0;font-size:13.5px;color:#5D5248;line-height:1.55;">
        Questions or need help? <a href="${esc(STUDIO_BUSINESS_INFO.whatsappUrl)}?text=${encodeURIComponent(`Hello Osemene, reaching out regarding booking ${ctx.referenceCode}`)}" style="color:#B8893A;font-weight:700;text-decoration:underline;">WhatsApp Osemene directly</a>.
      </p>
    </div>

    ${extraHtml ? `<div style="margin-top:20px;">${extraHtml}</div>` : ""}

    <!-- Footer Signoff -->
    <div style="padding:18px 8px 6px 8px;font-size:12px;color:#7A6E63;line-height:1.6;">
      ${esc(STUDIO_BUSINESS_INFO.name)} · ${esc(STUDIO_BUSINESS_INFO.location)} · ${esc(STUDIO_BUSINESS_INFO.phone)} · ${esc(STUDIO_BUSINESS_INFO.socialHandle)}
    </div>
  </div>
</body>
</html>`;
}

export function renderBookingEmail(
  event: EmailPipelineEvent,
  ctx: BookingEmailContext,
  options?: { oldDateLabel?: string }
): RenderedEmailContent {
  const siteUrl = getSiteUrl();
  const bookingUrl = `${siteUrl}/book?ref=${encodeURIComponent(ctx.referenceCode)}`;
  const rebookUrl = `${siteUrl}/book?session=${encodeURIComponent(ctx.sessionType)}`;
  const dateLabel = formatReadableDateWAT(ctx.shootDateFormatted || ctx.answers?.selectedDate);
  const timeLabel = ctx.shootTimeSlot || ctx.answers?.timeSlot || "";
  const slotSummary = [dateLabel, timeLabel].filter(Boolean).join(" at ");

  switch (event) {
    case "hold_started": {
      return {
        subject: `Slot Held (20h): ${ctx.sessionTitle} · Ref ${ctx.referenceCode}`,
        icsMethod: "REQUEST",
        html: wrapAtelierEmail({
          eyebrow: "20-HOUR HOLD RESERVED",
          headlinePrefix: "YOUR DATE IS ",
          headlineAccent: "ON HOLD.",
          introText: `Hi ${ctx.client.name}, we are holding ${slotSummary || "your preferred date"} on Osemene's private Abuja studio calendar for the next 20 hours while we await your deposit confirmation.`,
          ctx,
          ctaLabel: "Complete Deposit & View Booking",
          ctaHref: bookingUrl,
          bankNotice: true,
        }),
        text: `Hi ${ctx.client.name}, your ${ctx.sessionTitle} slot (${slotSummary}) is held for 20 hours (Ref: ${ctx.referenceCode}). Manage booking: ${bookingUrl}`,
      };
    }

    case "hold_ended": {
      return {
        subject: `Your hold has ended: ${ctx.sessionTitle} · Ref ${ctx.referenceCode}`,
        icsMethod: "CANCEL",
        html: wrapAtelierEmail({
          eyebrow: "HOLD ENDED",
          headlinePrefix: "YOUR HOLD ",
          headlineAccent: "HAS ENDED.",
          introText: `Hi ${ctx.client.name}, we didn't receive a confirmed deposit for ${ctx.sessionTitle} (${slotSummary}) within the 20-hour window, so that studio time has reopened for other clients. If you have already made a transfer, WhatsApp Osemene with your receipt right away or pick a fresh slot below.`,
          ctx,
          ctaLabel: "Book Another Time",
          ctaHref: rebookUrl,
        }),
        text: `Your 20-hour hold for ${ctx.sessionTitle} (Ref: ${ctx.referenceCode}) has ended. Rebook at: ${rebookUrl}`,
      };
    }

    case "cancelled": {
      return {
        subject: `Session Cancelled: ${ctx.sessionTitle} · Ref ${ctx.referenceCode}`,
        icsMethod: "CANCEL",
        html: wrapAtelierEmail({
          eyebrow: "CANCELLED",
          headlinePrefix: "YOUR SESSION IS ",
          headlineAccent: "CANCELLED.",
          introText: `Hi ${ctx.client.name}, ${ctx.sessionTitle} scheduled for ${slotSummary || "your selected date"} has been released from Osemene's Abuja calendar${ctx.closedReason ? ` (${ctx.closedReason})` : ""}. Whenever you are ready to shoot, you can reserve another slot in seconds.`,
          ctx,
          ctaLabel: "Book Another Time",
          ctaHref: rebookUrl,
        }),
        text: `Your ${ctx.sessionTitle} booking (${ctx.referenceCode}) has been cancelled. Rebook anytime: ${rebookUrl}`,
      };
    }

    case "rescheduled": {
      return {
        subject: `Session Rescheduled: ${ctx.sessionTitle} · ${dateLabel} (${ctx.referenceCode})`,
        icsMethod: "REQUEST",
        html: wrapAtelierEmail({
          eyebrow: "RESCHEDULED",
          headlinePrefix: "YOUR NEW DATE IS ",
          headlineAccent: "LOCKED.",
          introText: `Hi ${ctx.client.name}, your ${ctx.sessionTitle} session has been moved${options?.oldDateLabel ? ` from ${options.oldDateLabel}` : ""} to ${slotSummary} on Osemene's studio calendar. Your updated calendar invitation is attached.`,
          ctx,
          ctaLabel: "View Updated Booking",
          ctaHref: bookingUrl,
        }),
        text: `Your ${ctx.sessionTitle} booking (${ctx.referenceCode}) has been rescheduled to ${slotSummary}. Manage booking: ${bookingUrl}`,
      };
    }

    case "deposit_confirmed": {
      const invoiceInner = buildCrispFinancialDocumentInner(ctx, "invoice");
      return {
        subject: `Deposit Confirmed & Invoice: ${ctx.sessionTitle} · Ref ${ctx.referenceCode}`,
        icsMethod: "REQUEST",
        attachmentDoc: {
          filename: `LamSparks-Invoice-${ctx.referenceCode}.html`,
          html: invoiceInner,
          kind: "invoice",
        },
        html: wrapAtelierEmail({
          eyebrow: "HOLD CONFIRMED · INVOICE ISSUED",
          headlinePrefix: "YOUR DEPOSIT IS ",
          headlineAccent: "CONFIRMED.",
          introText: `Thank you ${ctx.client.name}! Your deposit for ${ctx.sessionTitle} (${slotSummary}) is confirmed and your date is permanently reserved on Osemene's private Abuja calendar. Your full itemised invoice is below.`,
          ctx,
          ctaLabel: "Manage Booking & Wardrobe Prep",
          ctaHref: bookingUrl,
          extraHtml: invoiceInner,
        }),
        text: `Deposit confirmed for ${ctx.sessionTitle} (${ctx.referenceCode}). Invoice attached. Manage booking: ${bookingUrl}`,
      };
    }

    case "receipt_issued": {
      const receiptInner = buildCrispFinancialDocumentInner(ctx, "receipt");
      return {
        subject: `Official Receipt: ${ctx.sessionTitle} Completed · Ref ${ctx.referenceCode}`,
        attachmentDoc: {
          filename: `LamSparks-Receipt-${ctx.referenceCode}.html`,
          html: receiptInner,
          kind: "receipt",
        },
        html: wrapAtelierEmail({
          eyebrow: "OFFICIAL RECEIPT",
          headlinePrefix: "YOUR SESSION IS ",
          headlineAccent: "COMPLETE.",
          introText: `Thank you for creating memories with LamSparks Photography, ${ctx.client.name}! Your session is complete and settled — find your Official Receipt attached below.`,
          ctx,
          ctaLabel: "View Booking Archive",
          ctaHref: bookingUrl,
          extraHtml: receiptInner,
        }),
        text: `Official Receipt for ${ctx.sessionTitle} (${ctx.referenceCode}). View your archive: ${bookingUrl}`,
      };
    }

    case "agreed_to_price":
    case "deposit_reported":
    case "stage_updated":
    default: {
      const stageKey = event === "stage_updated" ? ctx.stage : event;
      const copy = KANBAN_STAGE_COPY[stageKey] || {
        eyebrow: stageKey.replace(/_/g, " ").toUpperCase(),
        headlinePrefix: "BOOKING STATUS ",
        headlineAccent: "UPDATED.",
        message: `Your ${ctx.sessionTitle} reservation (${ctx.referenceCode}) has progressed to the "${stageKey.replace(/_/g, " ")}" stage in our studio workflow.`,
        subjectVerb: `Booking updated (${stageKey.replace(/_/g, " ")})`,
      };

      const shouldIncludeInvoice = stageKey === "deposit_paid";
      const shouldIncludeReceipt = stageKey === "delivered" || stageKey === "closed";
      const docInner = shouldIncludeReceipt
        ? buildCrispFinancialDocumentInner(ctx, "receipt")
        : shouldIncludeInvoice
        ? buildCrispFinancialDocumentInner(ctx, "invoice")
        : "";

      return {
        subject: `${copy.subjectVerb}: ${ctx.sessionTitle} · Ref ${ctx.referenceCode}`,
        icsMethod:
          stageKey === "confirmed" || stageKey === "deposit_paid" || stageKey === "preparation"
            ? "REQUEST"
            : undefined,
        ...(shouldIncludeReceipt
          ? {
              attachmentDoc: {
                filename: `LamSparks-Receipt-${ctx.referenceCode}.html`,
                html: docInner,
                kind: "receipt" as const,
              },
            }
          : shouldIncludeInvoice
          ? {
              attachmentDoc: {
                filename: `LamSparks-Invoice-${ctx.referenceCode}.html`,
                html: docInner,
                kind: "invoice" as const,
              },
            }
          : {}),
        html: wrapAtelierEmail({
          eyebrow: copy.eyebrow,
          headlinePrefix: copy.headlinePrefix,
          headlineAccent: copy.headlineAccent,
          introText: `Hi ${ctx.client.name}, ${copy.message}`,
          ctx,
          ctaLabel: "Open Live Booking Link",
          ctaHref: bookingUrl,
          bankNotice: stageKey === "agreed_to_price",
          extraHtml: docInner,
        }),
        text: `${copy.subjectVerb} (${ctx.referenceCode}). Manage booking: ${bookingUrl}`,
      };
    }
  }
}

export function wrapOwnerCopyHtml(
  clientHtml: string,
  event: EmailPipelineEvent,
  ctx: BookingEmailContext
): string {
  const siteUrl = getSiteUrl();
  const banner = `
  <div style="max-width:640px;margin:0 auto 14px auto;background:#1A1410;color:#FAF7F2;border-radius:12px;padding:14px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12.5px;line-height:1.55;">
    <div style="font-size:10px;font-weight:800;letter-spacing:0.18em;color:#C9A96E;text-transform:uppercase;margin-bottom:4px;">
      STUDIO OWNER COPY · EVENT: ${esc(event.toUpperCase())} (${esc(ctx.stage.toUpperCase())})
    </div>
    <div><strong>Client:</strong> ${esc(ctx.client.name)} · <strong>WhatsApp:</strong> ${esc(ctx.client.whatsapp)} · <strong>Email:</strong> ${esc(ctx.client.email || "Not provided")}</div>
    <div><strong>Ref:</strong> ${esc(ctx.referenceCode)} · <a href="${esc(siteUrl)}/studio/pipeline" style="color:#C9A96E;text-decoration:underline;">Open Studio Kanban</a> · <a href="${esc(siteUrl)}/book?ref=${esc(ctx.referenceCode)}" style="color:#C9A96E;text-decoration:underline;">Booking Link</a></div>
  </div>`;

  return clientHtml.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
}
