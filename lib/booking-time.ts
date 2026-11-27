/**
 * Pure West Africa Time (Africa/Lagos, UTC+1) scheduling helpers safe for both
 * client components and server routes.
 */

export const HOLD_DURATION_HOURS = 20;
export const HOLD_DURATION_MS = HOLD_DURATION_HOURS * 60 * 60 * 1000;
export const ABUJA_TIMEZONE = "Africa/Lagos";

/**
 * Normalizes a YYYY-MM-DD calendar date and 12-hour slot string (e.g. "11:00 AM")
 * into UTC ISO timestamps treated as West Africa Time (Africa/Lagos, UTC+1).
 */
export function parseSlotToTimestampsWAT(
  dateStr: string,
  timeSlot: string,
  durationMinutes: number = 90
): { start: string; end: string } {
  try {
    const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const fallbackStart = new Date(dateStr);
      if (!isNaN(fallbackStart.getTime())) {
        const fallbackEnd = new Date(fallbackStart.getTime() + durationMinutes * 60000);
        return { start: fallbackStart.toISOString(), end: fallbackEnd.toISOString() };
      }
      throw new Error("Invalid date/slot input");
    }

    const [, hoursStr, minsStr, ampm] = match;
    let hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);
    if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;

    const isoWithOffset = `${dateStr.trim()}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00+01:00`;
    const start = new Date(isoWithOffset);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    return { start: start.toISOString(), end: end.toISOString() };
  } catch {
    const now = new Date();
    return {
      start: now.toISOString(),
      end: new Date(now.getTime() + durationMinutes * 60000).toISOString(),
    };
  }
}

/**
 * Formats a database timestamp (or stored slot) into YYYY-MM-DD and "hh:mm AM/PM"
 * in Abuja Time (Africa/Lagos).
 */
export function extractDateAndSlotWAT(
  shootStart: string | Date,
  answers?: Record<string, any> | null
): { date: string; timeSlot: string } {
  const start = new Date(shootStart);
  if (isNaN(start.getTime())) {
    return {
      date: (answers?.selectedDate as string) || "",
      timeSlot: (answers?.timeSlot as string) || "",
    };
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ABUJA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(start);
  const y = dateParts.find((p) => p.type === "year")?.value || "2026";
  const m = dateParts.find((p) => p.type === "month")?.value || "01";
  const d = dateParts.find((p) => p.type === "day")?.value || "01";
  const dateStr = `${y}-${m}-${d}`;

  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ABUJA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(start);
  const hr = (timeParts.find((p) => p.type === "hour")?.value || "09").padStart(2, "0");
  const min = (timeParts.find((p) => p.type === "minute")?.value || "30").padStart(2, "0");
  const dayPeriod = (timeParts.find((p) => p.type === "dayPeriod")?.value || "AM").toUpperCase();
  const formattedTime = `${hr}:${min} ${dayPeriod}`;

  return {
    date: dateStr,
    timeSlot: formattedTime || (answers?.timeSlot as string) || "",
  };
}
