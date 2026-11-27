import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";
import { renderBookingEmail, wrapOwnerCopyHtml } from "./templates";
import { buildBookingIcs } from "./ics";
import { buildCrispFinancialDocumentInner, buildPrintableDocumentPage } from "./documents";
import { loadBookingEmailContext } from "./mailer";
import type { BookingEmailContext, EmailPipelineEvent } from "./types";

async function main() {
  const sampleCtx: BookingEmailContext = {
    enquiryId: "enq-verify-001",
    referenceCode: "LS-VERIFY",
    sessionType: "toddler",
    sessionTitle: "Toddler & Children",
    stage: "confirmed",
    bookingStatus: "confirmed",
    shootStart: "2026-12-05T10:00:00.000Z",
    shootEnd: "2026-12-05T11:30:00.000Z",
    shootDateFormatted: "2026-12-05",
    shootTimeSlot: "11:00 AM",
    rescheduleCount: 0,
    locationType: "studio",
    locationDetail: "LamSparks Private Studio, Maitama, Abuja",
    holdExpiresAt: "2026-12-04T10:00:00.000Z",
    closedReason: null,
    purposeText: "2nd Birthday Milestone Shoot",
    feelingText: "Warm, playful, natural light",
    createdAt: new Date().toISOString(),
    client: {
      id: "cli-verify-001",
      name: "Adaeze Okafor",
      email: "adaeze@example.com",
      whatsapp: "+2348012345678",
    },
    answers: {
      packageName: "The Premium",
      outfitCount: 3,
      peopleCount: 2,
      age: "2 years",
      notes: "Cream knitwear + pastel tones",
    },
    estimate: {
      total: 350000,
      depositPercent: 70,
      depositAmount: 245000,
      balanceAmount: 105000,
      lineItems: [
        { label: "The Premium — Toddler & Children", amount: 350000, category: "Package" },
      ],
    },
    payment: {
      id: "pay-verify-001",
      status: "recorded",
      amountExpected: 245000,
      amountRecorded: 245000,
      bankReference: "FID-9928172",
      recordedBy: "Gemini Vision OCR Verified",
      recordedAt: new Date().toISOString(),
    },
  };

  // 1. Verify every EmailPipelineEvent renders cleanly
  const events: EmailPipelineEvent[] = [
    "hold_started",
    "hold_ended",
    "agreed_to_price",
    "deposit_reported",
    "deposit_confirmed",
    "rescheduled",
    "cancelled",
    "receipt_issued",
  ];

  for (const ev of events) {
    const rendered = renderBookingEmail(ev, sampleCtx, {
      oldDateLabel: "Friday, 4 December 2026 at 09:30 AM",
    });
    assert.ok(rendered.subject.includes("LS-VERIFY"), `Subject missing ref for ${ev}`);
    assert.ok(rendered.html.includes("Adaeze"), `HTML missing client first name for ${ev}`);
    assert.ok(!rendered.html.includes("Hi Adaeze Okafor"), `HTML greeting used full name instead of first name for ${ev}`);
    assert.ok(rendered.html.includes("/book?ref=LS-VERIFY"), `HTML missing booking link for ${ev}`);
    assert.ok(rendered.html.includes("The Premium"), `HTML missing package name for ${ev}`);

    const ownerHtml = wrapOwnerCopyHtml(rendered.html, ev, sampleCtx);
    assert.ok(ownerHtml.includes("STUDIO OWNER COPY"), `Owner wrapper missing for ${ev}`);
  }

  // 2. Verify all 11 Kanban stages produce tailored stage_updated emails
  const stages = [
    "enquiry",
    "agreed_to_price",
    "deposit_reported",
    "deposit_paid",
    "preparation",
    "confirmed",
    "shot",
    "editing",
    "client_review",
    "delivered",
    "closed",
  ];
  for (const st of stages) {
    const ctx = { ...sampleCtx, stage: st };
    const rendered = renderBookingEmail("stage_updated", ctx);
    assert.ok(rendered.subject.length > 10, `Empty subject for stage ${st}`);
    assert.ok(rendered.html.includes("LS-VERIFY"), `Missing ref for stage ${st}`);
    if (st === "deposit_paid") {
      assert.equal(rendered.attachmentDoc?.kind, "invoice");
    }
    if (st === "delivered" || st === "closed") {
      assert.equal(rendered.attachmentDoc?.kind, "receipt");
    }
  }

  // 3. Verify crisp Invoice & Official Receipt content + LamSparks business info
  const invHtml = buildCrispFinancialDocumentInner(sampleCtx, "invoice");
  assert.ok(invHtml.includes("INVOICE"));
  assert.ok(invHtml.includes("INV-LS-VERIFY"));
  assert.ok(invHtml.includes("LamSparks Photography"));
  assert.ok(invHtml.includes("08130847299"));
  assert.ok(invHtml.includes("Lamsparksphotography@gmail.com"));
  assert.ok(invHtml.includes("No refund after payment is made"));
  assert.ok(invHtml.includes("Cream knitwear + pastel tones"));
  assert.ok(invHtml.includes("245,000"));
  assert.ok(invHtml.includes("105,000"));

  const rctHtml = buildPrintableDocumentPage(sampleCtx, "receipt");
  assert.ok(rctHtml.includes("OFFICIAL RECEIPT"));
  assert.ok(rctHtml.includes("RCT-LS-VERIFY"));
  assert.ok(rctHtml.includes("COMPLETED"));
  assert.ok(rctHtml.includes("Total Paid:"));

  // 4. Verify .ics Calendar REQUEST and CANCEL output
  const icsReq = buildBookingIcs(sampleCtx, {
    method: "REQUEST",
    bookingUrl: "https://lamsparks.vercel.app/book?ref=LS-VERIFY",
    senderEmail: process.env.SMTP_USER || "yemuelinc@gmail.com",
  });
  assert.ok(icsReq?.includes("METHOD:REQUEST"));
  assert.ok(icsReq?.includes("BEGIN:VEVENT"));

  const icsCancel = buildBookingIcs(sampleCtx, {
    method: "CANCEL",
    bookingUrl: "https://lamsparks.vercel.app/book?ref=LS-VERIFY",
    senderEmail: process.env.SMTP_USER || "yemuelinc@gmail.com",
  });
  assert.ok(icsCancel?.includes("METHOD:CANCEL"));
  assert.ok(icsCancel?.includes("STATUS:CANCELLED"));

  // 5. Verify live Neon DB context loader against latest real enquiry row
  const sql = neon(process.env.DATABASE_URL!);
  const latestEnq = await sql.query(`SELECT reference_code FROM enquiry ORDER BY created_at DESC LIMIT 1`);
  if (latestEnq.length > 0) {
    const dbCtx = await loadBookingEmailContext(sql, { referenceCode: latestEnq[0].reference_code });
    assert.ok(dbCtx, "loadBookingEmailContext returned null for real DB record");
    assert.equal(dbCtx?.referenceCode, latestEnq[0].reference_code);
    console.log("DB context verified for:", dbCtx?.referenceCode, "->", dbCtx?.sessionTitle);
  }

  // 6. Verify live SMTP Auth
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.verify();
  console.log("ALL EMAIL PIPELINE ASSERTIONS + DB + SMTP VERIFICATION PASSED!");
}

main().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  process.exit(1);
});
