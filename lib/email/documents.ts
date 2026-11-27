import type { BookingEmailContext } from "./types";
import { STUDIO_BUSINESS_INFO } from "./types";
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

export function formatReadableDateWAT(isoOrYmd?: string | null): string {
  if (!isoOrYmd) return "Flexible / To Be Scheduled";
  const d = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(isoOrYmd) ? `${isoOrYmd}T12:00:00+01:00` : isoOrYmd
  );
  if (isNaN(d.getTime())) return String(isoOrYmd);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function buildBookingSummaryLines(ctx: BookingEmailContext): { label: string; value: string }[] {
  const details: { label: string; value: string }[] = [
    { label: "Booking Ref", value: ctx.referenceCode },
    { label: "Session", value: ctx.sessionTitle },
  ];

  if (ctx.answers?.packageName) {
    details.push({ label: "Package", value: String(ctx.answers.packageName) });
  }
  if (ctx.shootDateFormatted || ctx.answers?.selectedDate) {
    details.push({
      label: "Date",
      value: formatReadableDateWAT(ctx.shootDateFormatted || ctx.answers?.selectedDate),
    });
  }
  if (ctx.shootTimeSlot || ctx.answers?.timeSlot) {
    details.push({
      label: "Time",
      value: String(ctx.shootTimeSlot || ctx.answers?.timeSlot),
    });
  }
  details.push({
    label: "Location",
    value: ctx.locationDetail || STUDIO_BUSINESS_INFO.location,
  });
  if (ctx.answers?.outfitCount) {
    details.push({ label: "Outfits", value: `${ctx.answers.outfitCount} outfit(s)` });
  }
  if (ctx.answers?.peopleCount) {
    details.push({ label: "Participants", value: `${ctx.answers.peopleCount} person(s)` });
  }
  if (ctx.answers?.age || ctx.answers?.ages) {
    details.push({ label: "Age(s)", value: String(ctx.answers.age || ctx.answers.ages) });
  }
  if (ctx.answers?.guestCount) {
    details.push({ label: "Guest Count", value: String(ctx.answers.guestCount) });
  }
  if (ctx.answers?.coupleNames) {
    details.push({ label: "Couple", value: String(ctx.answers.coupleNames) });
  }
  const singleNote = ctx.answers?.notes
    ? String(ctx.answers.notes).trim()
    : ctx.purposeText &&
      !ctx.purposeText.toLowerCase().includes(ctx.sessionTitle.toLowerCase())
    ? ctx.purposeText.trim()
    : "";
  if (singleNote) {
    details.push({ label: "Notes", value: singleNote });
  }
  return details;
}

function buildItemRows(ctx: BookingEmailContext): { description: string; qty: number; rate: number; amount: number }[] {
  const lineItems = Array.isArray(ctx.estimate.lineItems) ? ctx.estimate.lineItems : [];
  if (lineItems.length > 0) {
    return lineItems.map((item) => ({
      description: String(item.label || ctx.sessionTitle),
      qty: 1,
      rate: Number(item.amount) || 0,
      amount: Number(item.amount) || 0,
    }));
  }

  return [
    {
      description: `${ctx.sessionTitle}${ctx.answers?.packageName ? ` — ${ctx.answers.packageName}` : ""}`,
      qty: 1,
      rate: ctx.estimate.total || 0,
      amount: ctx.estimate.total || 0,
    },
  ];
}

/**
 * Generates an inline-CSS crisp, minimalist Invoice or Official Receipt block
 * styled after the user's preferred clean document layout (Black/White crisp typography,
 * strong divider rule, Bill To vs Service Details, clean itemised rows, complete totals,
 * and LamSparks business info + live Booking Link).
 */
export function buildCrispFinancialDocumentInner(
  ctx: BookingEmailContext,
  kind: "invoice" | "receipt"
): string {
  const siteUrl = getSiteUrl();
  const bookingUrl = `${siteUrl}/book?ref=${encodeURIComponent(ctx.referenceCode)}`;
  const docUrl = `${siteUrl}/api/booking/document?ref=${encodeURIComponent(ctx.referenceCode)}&type=${kind}`;
  const isReceipt = kind === "receipt";

  const issuedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const totalAmount = Number(ctx.estimate.total) || 0;
  const depositPaid = Number(ctx.payment.amountRecorded || ctx.estimate.depositAmount || 0);
  const effectivePaid = isReceipt ? totalAmount || depositPaid : depositPaid;
  const balanceDue = isReceipt ? 0 : Math.max(0, totalAmount - effectivePaid);
  const isPaidInFull = balanceDue <= 0 && totalAmount > 0;

  const statusBadgeText = isReceipt
    ? "COMPLETED · PAID IN FULL"
    : isPaidInFull
    ? "PAID IN FULL"
    : "DEPOSIT CONFIRMED";
  const statusColor = isReceipt || isPaidInFull ? "#15803D" : "#B45309";

  const docNo = isReceipt ? `RCT-${ctx.referenceCode}` : `INV-${ctx.referenceCode}`;
  const docTitle = isReceipt ? "OFFICIAL RECEIPT" : "INVOICE";
  const rows = buildItemRows(ctx);
  const serviceDetails = buildBookingSummaryLines(ctx);

  return `
<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:28px 26px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;">
  <!-- Header Row -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <tr>
      <td valign="top" style="padding-bottom:14px;">
        <div style="font-size:22px;font-weight:800;letter-spacing:0.02em;color:#111111;margin:0 0 6px 0;">${docTitle}</div>
        <div style="font-size:12px;color:#4B5563;line-height:1.55;">
          <strong>${isReceipt ? "Receipt No" : "Invoice No"}:</strong> ${esc(docNo)}<br/>
          <strong>Booking Ref:</strong> ${esc(ctx.referenceCode)}<br/>
          <strong>Date Issued:</strong> ${esc(issuedDate)}
          ${ctx.payment.bankReference ? `<br/><strong>Bank Ref:</strong> ${esc(ctx.payment.bankReference)}` : ""}
        </div>
      </td>
      <td valign="top" align="right" style="padding-bottom:14px;">
        <div style="font-size:17px;font-weight:800;color:#111111;margin:0 0 4px 0;">${esc(STUDIO_BUSINESS_INFO.name)}</div>
        <div style="font-size:11.5px;color:#4B5563;line-height:1.55;">
          ${esc(STUDIO_BUSINESS_INFO.shortLocation)}<br/>
          Tel: ${esc(STUDIO_BUSINESS_INFO.displayPhone)}<br/>
          IG/FB: ${esc(STUDIO_BUSINESS_INFO.socialHandle)}<br/>
          ${esc(STUDIO_BUSINESS_INFO.email)}
        </div>
        <div style="margin-top:8px;font-size:11px;font-weight:800;letter-spacing:0.08em;color:${statusColor};">
          STATUS: ${statusBadgeText}
        </div>
      </td>
    </tr>
  </table>

  <div style="border-top:2px solid #111111;margin:10px 0 18px 0;"></div>

  <!-- Bill To & Service Details -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:20px;">
    <tr>
      <td width="48%" valign="top" style="padding-right:12px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">
          BILL TO
        </div>
        <div style="font-size:13.5px;font-weight:700;color:#111111;margin-bottom:3px;">
          ${esc(ctx.client.name)}
        </div>
        <div style="font-size:12px;color:#4B5563;line-height:1.6;">
          ${ctx.client.email ? `${esc(ctx.client.email)}<br/>` : ""}
          ${esc(ctx.client.whatsapp)}
        </div>
      </td>
      <td width="52%" valign="top" align="right" style="padding-left:12px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">
          SERVICE DETAILS
        </div>
        <div style="font-size:12px;color:#374151;line-height:1.6;">
          ${serviceDetails
            .filter((d) => ["Session", "Package", "Date", "Time", "Location", "Outfits", "Participants", "Age(s)", "Guest Count", "Couple"].includes(d.label))
            .map((d) => `<strong>${esc(d.label)}:</strong> ${esc(d.value)}`)
            .join("<br/>")}
        </div>
      </td>
    </tr>
  </table>

  <!-- Itemised Table -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:14px;">
    <thead>
      <tr style="border-top:1px solid #D1D5DB;border-bottom:1.5px solid #111111;background:#F9FAFB;">
        <th align="left" style="padding:9px 8px;font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5563;">SERVICE DESCRIPTION</th>
        <th align="center" style="padding:9px 8px;font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5563;width:48px;">QTY</th>
        ${
          !isReceipt
            ? `<th align="right" style="padding:9px 8px;font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5563;width:95px;">RATE</th>`
            : ""
        }
        <th align="right" style="padding:9px 8px;font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5563;width:105px;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:10px 8px;font-size:12.5px;font-weight:600;color:#111827;">${esc(row.description)}</td>
          <td align="center" style="padding:10px 8px;font-size:12.5px;color:#374151;">${row.qty}</td>
          ${
            !isReceipt
              ? `<td align="right" style="padding:10px 8px;font-size:12.5px;color:#374151;">${row.rate > 0 ? formatNaira(row.rate) : "Custom"}</td>`
              : ""
          }
          <td align="right" style="padding:10px 8px;font-size:12.5px;font-weight:600;color:#111827;">${row.amount > 0 ? formatNaira(row.amount) : "Bespoke"}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <!-- Additional Client Booking Note -->
  ${
    (() => {
      const note = ctx.answers?.notes
        ? String(ctx.answers.notes).trim()
        : ctx.purposeText &&
          !ctx.purposeText.toLowerCase().includes(ctx.sessionTitle.toLowerCase())
        ? ctx.purposeText.trim()
        : "";
      return note || ctx.feelingText
        ? `<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:11.5px;color:#4B5563;line-height:1.55;">
            ${note ? `<div><strong>Notes:</strong> ${esc(note)}</div>` : ""}
            ${ctx.feelingText ? `<div><strong>Mood / Vision:</strong> ${esc(ctx.feelingText)}</div>` : ""}
          </div>`
        : "";
    })()
  }

  <!-- Totals Block -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1.5px solid #111111;padding-top:10px;">
    ${
      isReceipt
        ? `
      <tr>
        <td align="right" style="padding:12px 8px 4px 8px;font-size:13px;font-weight:700;color:#374151;">Deposit Received (${ctx.estimate.depositPercent}%):</td>
        <td align="right" width="130" style="padding:12px 8px 4px 8px;font-size:13px;color:#111827;">${formatNaira(depositPaid)}</td>
      </tr>
      <tr>
        <td align="right" style="padding:4px 8px 10px 8px;font-size:14.5px;font-weight:800;color:#111111;">Total Paid:</td>
        <td align="right" width="130" style="padding:4px 8px 10px 8px;font-size:15px;font-weight:800;color:#15803D;">${totalAmount > 0 ? formatNaira(effectivePaid) : "Settled"}</td>
      </tr>`
        : `
      <tr>
        <td align="right" style="padding:10px 8px 3px 8px;font-size:12.5px;color:#4B5563;">Total Investment:</td>
        <td align="right" width="130" style="padding:10px 8px 3px 8px;font-size:12.5px;font-weight:700;color:#111827;">${totalAmount > 0 ? formatNaira(totalAmount) : "Custom Quote"}</td>
      </tr>
      <tr>
        <td align="right" style="padding:3px 8px;font-size:12.5px;color:#15803D;font-weight:600;">Deposit Paid (${ctx.estimate.depositPercent}%):</td>
        <td align="right" width="130" style="padding:3px 8px;font-size:12.5px;color:#15803D;font-weight:700;">${formatNaira(effectivePaid)}</td>
      </tr>
      <tr>
        <td align="right" style="padding:6px 8px 10px 8px;font-size:14px;font-weight:800;color:#111111;">Balance Due on Shoot Day:</td>
        <td align="right" width="130" style="padding:6px 8px 10px 8px;font-size:14px;font-weight:800;color:#111111;">${formatNaira(balanceDue)}</td>
      </tr>`
    }
  </table>

  <!-- Payment & Terms -->
  <div style="border-top:1px solid #E5E7EB;margin-top:10px;padding-top:14px;font-size:11.5px;color:#4B5563;line-height:1.6;">
    ${
      !isReceipt && balanceDue > 0
        ? `<div><strong>Balance Payment Account:</strong> ${esc(STUDIO_BUSINESS_INFO.bankName)} · <strong>${esc(STUDIO_BUSINESS_INFO.accountNumber)}</strong> (${esc(STUDIO_BUSINESS_INFO.accountName)})</div>`
        : ""
    }
    <div><strong>Terms:</strong> ${esc(STUDIO_BUSINESS_INFO.terms)}</div>
    <div style="margin-top:8px;">
      <a href="${esc(bookingUrl)}" style="color:#111111;font-weight:700;text-decoration:underline;">View Live Booking Portal (${esc(ctx.referenceCode)})</a>
      &nbsp;&middot;&nbsp;
      <a href="${esc(docUrl)}" style="color:#111111;font-weight:700;text-decoration:underline;">Open Printable ${isReceipt ? "Receipt" : "Invoice"}</a>
    </div>
  </div>

  <!-- Centered Footer -->
  <div style="text-align:center;margin-top:20px;padding-top:14px;border-top:1px solid #F3F4F6;font-size:11.5px;color:#6B7280;line-height:1.6;">
    Thank you for choosing ${esc(STUDIO_BUSINESS_INFO.name)}.<br/>
    If you have any questions about this document, reach us anytime on WhatsApp (${esc(STUDIO_BUSINESS_INFO.phone)}).
  </div>
</div>`;
}

/**
 * Wraps the crisp financial document into a full standalone printable HTML page
 * for browser PDF export and email file attachment.
 */
export function buildPrintableDocumentPage(
  ctx: BookingEmailContext,
  kind: "invoice" | "receipt"
): string {
  const title =
    kind === "receipt"
      ? `OFFICIAL RECEIPT - ${ctx.referenceCode} | ${STUDIO_BUSINESS_INFO.name}`
      : `INVOICE - ${ctx.referenceCode} | ${STUDIO_BUSINESS_INFO.name}`;
  const inner = buildCrispFinancialDocumentInner(ctx, kind);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    body { margin: 0; padding: 24px 14px; background: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .toolbar { max-width: 640px; margin: 0 auto 14px auto; display: flex; justify-content: flex-end; gap: 8px; }
    .print-btn { background: #111111; color: #FFFFFF; border: none; padding: 9px 18px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .toolbar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </div>
  ${inner}
</body>
</html>`;
}
