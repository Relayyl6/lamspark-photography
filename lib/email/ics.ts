import type { BookingEmailContext } from "./types";
import { STUDIO_BUSINESS_INFO } from "./types";

function formatIcsUtc(iso: string | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(val: string): string {
  return String(val || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export interface BuildIcsOptions {
  method: "REQUEST" | "CANCEL";
  bookingUrl: string;
  senderEmail: string;
}

/**
 * Generates an RFC-5545 calendar invite/cancellation (.ics) so Gmail and Apple Mail
 * display the interactive Google Calendar card automatically at the top of the email.
 */
export function buildBookingIcs(ctx: BookingEmailContext, opts: BuildIcsOptions): string | null {
  if (!ctx.shootStart) return null;

  const start = new Date(ctx.shootStart);
  if (isNaN(start.getTime())) return null;

  const end = ctx.shootEnd
    ? new Date(ctx.shootEnd)
    : new Date(start.getTime() + 90 * 60000);

  const dtStart = formatIcsUtc(start);
  const dtEnd = formatIcsUtc(end);
  const dtStamp = formatIcsUtc(new Date());
  const uid = `${ctx.referenceCode.toLowerCase()}@lamsparksphotography.com`;
  const sequence = Math.max(0, (ctx.rescheduleCount || 0) + (opts.method === "CANCEL" ? 2 : 0));

  const summary = `${ctx.sessionTitle} with ${STUDIO_BUSINESS_INFO.name}`;
  const location = ctx.locationDetail || STUDIO_BUSINESS_INFO.location;
  const descLines = [
    `Booking Reference: ${ctx.referenceCode}`,
    `Client: ${ctx.client.name} (${ctx.client.whatsapp})`,
    `Session: ${ctx.sessionTitle}`,
    ctx.answers?.packageName ? `Package: ${ctx.answers.packageName}` : "",
    ctx.answers?.outfitCount ? `Outfits: ${ctx.answers.outfitCount}` : "",
    `Manage Booking: ${opts.bookingUrl}`,
    `Studio WhatsApp: ${STUDIO_BUSINESS_INFO.phone}`,
  ]
    .filter(Boolean)
    .join("\\n");

  const status = opts.method === "CANCEL" ? "CANCELLED" : ctx.stage === "confirmed" || ctx.bookingStatus === "confirmed" ? "CONFIRMED" : "TENTATIVE";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LamSparks Photography//Studio OS Booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${opts.method}`,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SEQUENCE:${sequence}`,
    `STATUS:${status}`,
    `ORGANIZER;CN="${STUDIO_BUSINESS_INFO.name}":mailto:${opts.senderEmail}`,
    ...(ctx.client.email
      ? [`ATTENDEE;CN="${escapeIcsText(ctx.client.name)}";RSVP=TRUE:mailto:${ctx.client.email}`]
      : []),
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${descLines}`,
    `URL:${opts.bookingUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
