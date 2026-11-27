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
<div class="doc-card" style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:18px 16px;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:620px;width:100%;box-sizing:border-box;margin:0 auto;overflow-wrap:break-word;">
  <!-- Responsive Header (Stacks cleanly on narrow phones, splits left/right on desktop & print) -->
  <div class="doc-split" style="font-size:0;">
    <div class="doc-col" style="display:inline-block;width:100%;max-width:270px;vertical-align:top;margin-bottom:14px;font-size:12px;">
      <div style="font-size:20px;font-weight:800;letter-spacing:0.02em;color:#111111;margin:0 0 4px 0;">${docTitle}</div>
      <div style="font-size:10.5px;font-weight:800;letter-spacing:0.08em;color:${statusColor};margin-bottom:8px;">
        STATUS: ${statusBadgeText}
      </div>
      <div style="font-size:12px;color:#4B5563;line-height:1.6;">
        <strong>${isReceipt ? "Receipt No" : "Invoice No"}:</strong> ${esc(docNo)}<br/>
        <strong>Booking Ref:</strong> ${esc(ctx.referenceCode)}<br/>
        <strong>Date Issued:</strong> ${esc(issuedDate)}
        ${ctx.payment.bankReference ? `<br/><strong>Bank Ref:</strong> ${esc(ctx.payment.bankReference)}` : ""}
      </div>
    </div>
    <div class="doc-col doc-right" style="display:inline-block;width:100%;max-width:270px;vertical-align:top;margin-bottom:10px;font-size:12px;">
      <div style="font-size:16px;font-weight:800;color:#111111;margin:0 0 3px 0;">${esc(STUDIO_BUSINESS_INFO.name)}</div>
      <div style="font-size:11.5px;color:#4B5563;line-height:1.58;overflow-wrap:anywhere;word-break:break-word;">
        ${esc(STUDIO_BUSINESS_INFO.shortLocation)}<br/>
        Tel: ${esc(STUDIO_BUSINESS_INFO.displayPhone)}<br/>
        IG/FB: ${esc(STUDIO_BUSINESS_INFO.socialHandle)}<br/>
        ${esc(STUDIO_BUSINESS_INFO.email)}
      </div>
    </div>
  </div>

  <div style="border-top:2px solid #111111;margin:8px 0 16px 0;"></div>

  <!-- Bill To & Service Details (Fluid stacked blocks on mobile, 2 columns on desktop & print) -->
  <div class="doc-split" style="font-size:0;margin-bottom:16px;">
    <div class="doc-col" style="display:inline-block;width:100%;max-width:265px;vertical-align:top;margin-bottom:14px;font-size:12px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;margin-bottom:5px;">
        BILL TO
      </div>
      <div style="font-size:13.5px;font-weight:700;color:#111111;margin-bottom:3px;">
        ${esc(ctx.client.name)}
      </div>
      <div style="font-size:12px;color:#4B5563;line-height:1.58;overflow-wrap:anywhere;word-break:break-word;">
        ${ctx.client.email ? `${esc(ctx.client.email)}<br/>` : ""}
        ${esc(ctx.client.whatsapp)}
      </div>
    </div>
    <div class="doc-col doc-right" style="display:inline-block;width:100%;max-width:275px;vertical-align:top;margin-bottom:4px;font-size:12px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;margin-bottom:5px;">
        SERVICE DETAILS
      </div>
      <div style="font-size:12px;color:#374151;line-height:1.6;">
        ${serviceDetails
          .filter((d) => ["Session", "Package", "Date", "Time", "Location", "Outfits", "Participants", "Age(s)", "Guest Count", "Couple"].includes(d.label))
          .map((d) => `<strong>${esc(d.label)}:</strong> ${esc(d.value)}`)
          .join("<br/>")}
      </div>
    </div>
  </div>

  <!-- Clean 2-Column Itemised Table (Leaves full room for description on mobile) -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:12px;">
    <thead>
      <tr style="border-top:1px solid #D1D5DB;border-bottom:1.5px solid #111111;background:#F9FAFB;">
        <th align="left" style="padding:9px 8px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5563;">SERVICE</th>
        <th align="right" style="padding:9px 8px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4B5563;white-space:nowrap;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:10px 8px;font-size:12.5px;font-weight:600;color:#111827;line-height:1.45;">
            ${esc(row.description)}
            ${row.qty > 1 ? `<div style="font-size:11px;font-weight:400;color:#6B7280;">Qty: ${row.qty}</div>` : ""}
          </td>
          <td align="right" valign="top" style="padding:10px 8px;font-size:12.5px;font-weight:700;color:#111827;white-space:nowrap;">${row.amount > 0 ? formatNaira(row.amount) : "Bespoke"}</td>
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
        ? `<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:11.5px;color:#4B5563;line-height:1.55;">
            ${note ? `<div><strong>Notes:</strong> ${esc(note)}</div>` : ""}
            ${ctx.feelingText ? `<div><strong>Mood / Vision:</strong> ${esc(ctx.feelingText)}</div>` : ""}
          </div>`
        : "";
    })()
  }

  <!-- Clean Left-Label / Right-Value Totals Block -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1.5px solid #111111;">
    ${
      isReceipt
        ? `
      <tr>
        <td align="left" style="padding:11px 6px 4px 2px;font-size:12.5px;font-weight:600;color:#374151;">Deposit Received (${ctx.estimate.depositPercent}%)</td>
        <td align="right" style="padding:11px 2px 4px 6px;font-size:13px;color:#111827;white-space:nowrap;">${formatNaira(depositPaid)}</td>
      </tr>
      <tr>
        <td align="left" style="padding:5px 6px 8px 2px;font-size:14.5px;font-weight:800;color:#111111;">Total Paid:</td>
        <td align="right" style="padding:5px 2px 8px 6px;font-size:15px;font-weight:800;color:#15803D;white-space:nowrap;">${totalAmount > 0 ? formatNaira(effectivePaid) : "Settled"}</td>
      </tr>`
        : `
      <tr>
        <td align="left" style="padding:10px 6px 3px 2px;font-size:12.5px;color:#4B5563;">Total Investment</td>
        <td align="right" style="padding:10px 2px 3px 6px;font-size:12.5px;font-weight:700;color:#111827;white-space:nowrap;">${totalAmount > 0 ? formatNaira(totalAmount) : "Custom Quote"}</td>
      </tr>
      <tr>
        <td align="left" style="padding:3px 6px 3px 2px;font-size:12.5px;color:#15803D;font-weight:600;">Deposit Paid (${ctx.estimate.depositPercent}%)</td>
        <td align="right" style="padding:3px 2px 3px 6px;font-size:12.5px;color:#15803D;font-weight:700;white-space:nowrap;">${formatNaira(effectivePaid)}</td>
      </tr>
      <tr>
        <td align="left" style="padding:6px 6px 8px 2px;font-size:14px;font-weight:800;color:#111111;">Balance Due (Shoot Day)</td>
        <td align="right" style="padding:6px 2px 8px 6px;font-size:14px;font-weight:800;color:#111111;white-space:nowrap;">${formatNaira(balanceDue)}</td>
      </tr>`
    }
  </table>

  <!-- Payment & Terms -->
  <div style="border-top:1px solid #E5E7EB;margin-top:8px;padding-top:12px;font-size:11.5px;color:#4B5563;line-height:1.6;">
    ${
      !isReceipt && balanceDue > 0
        ? `<div style="margin-bottom:4px;"><strong>Balance Account:</strong> ${esc(STUDIO_BUSINESS_INFO.bankName)} · <strong>${esc(STUDIO_BUSINESS_INFO.accountNumber)}</strong> (${esc(STUDIO_BUSINESS_INFO.accountName)})</div>`
        : ""
    }
    <div><strong>Terms:</strong> ${esc(STUDIO_BUSINESS_INFO.terms)}</div>
    <div style="margin-top:10px;">
      <a href="${esc(bookingUrl)}" style="display:inline-block;margin:2px 12px 2px 0;color:#111111;font-weight:700;text-decoration:underline;">View Live Booking (${esc(ctx.referenceCode)})</a>
      <a href="${esc(docUrl)}" style="display:inline-block;margin:2px 0;color:#111111;font-weight:700;text-decoration:underline;">Open Printable ${isReceipt ? "Receipt" : "Invoice"}</a>
    </div>
  </div>

  <!-- Centered Footer -->
  <div style="text-align:center;margin-top:18px;padding-top:12px;border-top:1px solid #F3F4F6;font-size:11.5px;color:#6B7280;line-height:1.55;">
    Thank you for choosing ${esc(STUDIO_BUSINESS_INFO.name)}.<br/>
    Questions? WhatsApp us anytime (${esc(STUDIO_BUSINESS_INFO.phone)}).
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
  const siteUrl = getSiteUrl();
  const bookingUrl = `${siteUrl}/book?ref=${encodeURIComponent(ctx.referenceCode)}`;
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
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px 10px 28px 10px; background: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .toolbar { max-width: 620px; margin: 0 auto 12px auto; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .back-link { font-size: 12px; font-weight: 600; color: #374151; text-decoration: none; }
    .print-btn { background: #111111; color: #FFFFFF; border: none; padding: 9px 16px; border-radius: 999px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; }
    @media (min-width: 560px), print {
      body { padding: 24px 16px; }
      .doc-card { padding: 28px 26px !important; }
      .doc-split { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; gap: 18px !important; }
      .doc-col { flex: 1 1 0 !important; width: auto !important; max-width: none !important; margin-bottom: 0 !important; }
      .doc-right { text-align: right !important; }
    }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .toolbar { display: none !important; }
      .doc-card { border: none !important; padding: 8px 4px !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <a class="back-link" href="${esc(bookingUrl)}">&larr; Back to Booking</a>
    <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </div>
  ${inner}
</body>
</html>`;
}
