import type { BookingAnswers, EstimateLineItem, EstimateResult, SessionTypeSlug, PackageItem } from "../types";
import { PACKAGES, ADD_ONS, SESSION_TYPES, SessionTypeMeta } from "../catalog/seed";

export const RULES_VERSION = "2026.11.1";

/**
 * Pure function: calculate itemised estimate for a session based on answers & catalog.
 * Supports live DB overrides from Neon / Studio.
 * No side effects. Rounds to whole naira.
 */
export function calculateEstimate(
  sessionType: SessionTypeSlug,
  answers: BookingAnswers,
  customPackageId?: string,
  overridePackages?: PackageItem[],
  overrideSessionMeta?: SessionTypeMeta | any
): EstimateResult {
  const meta = overrideSessionMeta || SESSION_TYPES[sessionType] || SESSION_TYPES["toddler"];
  const targetPackageId = customPackageId || answers.packageId;
  const packageList = overridePackages && overridePackages.length > 0 ? overridePackages : PACKAGES;

  // Find selected package
  const pkg = packageList.find((p) => p.id === targetPackageId && p.sessionType === sessionType) ||
              packageList.find((p) => p.sessionType === sessionType);

  const lineItems: EstimateLineItem[] = [];

  // If session type requires personal quote (e.g. wedding, not-sure)
  if (!pkg || pkg.price === null || (meta.fromPrice === null && (!overridePackages || overridePackages.length === 0))) {
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return {
      sessionType,
      packageName: pkg ? pkg.name : "Bespoke / Custom Consultation",
      lineItems: [
        {
          id: "custom-quote-line",
          label: "Bespoke Coverage Consultation",
          detail: "Tailored quote prepared directly by Osemene upon enquiry submission",
          amount: 0,
        },
      ],
      total: 0,
      depositPercent: meta.depositPercent || meta.defaultDepositPercent || 70,
      depositAmount: 0,
      balanceAmount: 0,
      deliveryTimeline: meta.delivery_days || meta.standardDeliveryDays || "5 to 7 business days",
      termsNote: "A custom proposal and payment schedule will be provided following your consultation.",
      rulesVersion: RULES_VERSION,
      validUntil,
      quoteRequired: true,
    };
  }

  // 1. Base package line item
  lineItems.push({
    id: `base-${pkg.id}`,
    label: `${pkg.name} Package (${meta.title})`,
    detail: pkg.inclusions.slice(0, 3).join(", ") + "...",
    amount: pkg.price,
  });

  let runningTotal = pkg.price;

  // 2. Extra Family Members (Toddler / Child)
  if (sessionType === "toddler" && answers.additionalFamilyCount && answers.additionalFamilyCount > 0) {
    const addon = ADD_ONS.find((a) => a.id === "addon-toddler-family-member");
    const unitPrice = addon?.price || 30000;
    const addAmount = unitPrice * answers.additionalFamilyCount;
    lineItems.push({
      id: "addon-additional-family",
      label: `Additional Family Members (${answers.additionalFamilyCount}x)`,
      detail: `₦${unitPrice.toLocaleString()} per additional sibling / family member`,
      amount: addAmount,
    });
    runningTotal += addAmount;
  }

  // 3. Additional Child (Twins / Multiples at 50% of package)
  if (sessionType === "toddler" && answers.additionalChildCount && answers.additionalChildCount > 0) {
    const percentCost = Math.round((pkg.price * 0.5) * answers.additionalChildCount);
    lineItems.push({
      id: "addon-multiple-children",
      label: `Additional Child / Multiples (${answers.additionalChildCount}x)`,
      detail: `50% of ${pkg.name} package per additional child`,
      amount: percentCost,
    });
    runningTotal += percentCost;
  }

  // 4. Family Portrait Special Add-On (for Toddler)
  if (sessionType === "toddler" && answers.selectedAddOns?.includes("addon-toddler-family-special")) {
    const addon = ADD_ONS.find((a) => a.id === "addon-toddler-family-special");
    const addAmount = addon?.price || 100000;
    lineItems.push({
      id: "addon-family-special",
      label: "Family Portrait Special Add-On",
      detail: "1 outfit change, 1 backdrop, 3 edited images",
      amount: addAmount,
    });
    runningTotal += addAmount;
  }

  // 5. Maternity Extra Person (Partner / Sibling)
  if (sessionType === "maternity" && answers.peopleCount && answers.peopleCount > 1) {
    const extraCount = answers.peopleCount - 1;
    const unitPrice = 20000;
    const addAmount = unitPrice * extraCount;
    lineItems.push({
      id: "addon-maternity-partner",
      label: `Additional Person in Session (${extraCount}x)`,
      detail: `₦${unitPrice.toLocaleString()} per partner / sibling included`,
      amount: addAmount,
    });
    runningTotal += addAmount;
  }

  // 6. Extra Images (Maternity / Studio)
  if (answers.extraImagesCount && answers.extraImagesCount > 0) {
    const unitPrice = 10000;
    const addAmount = unitPrice * answers.extraImagesCount;
    lineItems.push({
      id: "addon-extra-images",
      label: `Additional Edited Images (${answers.extraImagesCount}x)`,
      detail: `₦${unitPrice.toLocaleString()} per professionally retouched image`,
      amount: addAmount,
    });
    runningTotal += addAmount;
  }

  // 7. Content Reels (Maternity: 150k, Event: 200k)
  if (answers.reelsAddon || answers.selectedAddOns?.includes("reels")) {
    const reelPrice = sessionType === "event" ? 200000 : 150000;
    lineItems.push({
      id: "addon-content-reels",
      label: "Short Cinematic Content Reels (2 videos)",
      detail: "Digitally delivered, edited for social media / mobile",
      amount: reelPrice,
    });
    runningTotal += reelPrice;
  }

  // 8. Event Extra Hours
  if (sessionType === "event" && answers.extraHours && answers.extraHours > 0) {
    const unitPrice = 35000;
    const addAmount = unitPrice * answers.extraHours;
    lineItems.push({
      id: "addon-event-extra-hours",
      label: `Additional Event Hours (${answers.extraHours}h)`,
      detail: `₦${unitPrice.toLocaleString()} per additional coverage hour`,
      amount: addAmount,
    });
    runningTotal += addAmount;
  }

  // 9. Priority / Express Delivery
  let deliveryTimeline = meta.standardDeliveryDays;
  if (answers.priorityEditing || answers.expressDelivery || answers.selectedAddOns?.includes("express")) {
    const expressPrice = 30000;
    deliveryTimeline = meta.expressDeliveryDays || "3 to 5 business days";
    lineItems.push({
      id: "addon-express-delivery",
      label: "Express Priority Delivery",
      detail: `Expedited turnaround: ${deliveryTimeline}`,
      amount: expressPrice,
    });
    runningTotal += expressPrice;
  }

  // Round total to whole integer
  const finalTotal = Math.round(runningTotal);
  const depositPercent = meta.depositPercent || meta.defaultDepositPercent || 70;
  const depositAmount = Math.round((finalTotal * depositPercent) / 100);
  const balanceAmount = finalTotal - depositAmount;

  // Valid for 7 days
  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const termsNote = `Booking fees (${depositPercent}%) are strictly non-refundable and secure your session date and studio time. The remaining balance (₦${balanceAmount.toLocaleString()}) is due on or before session day. Rescheduling requires minimum 48 hours notice.`;

  return {
    sessionType,
    packageName: pkg.name,
    lineItems,
    total: finalTotal,
    depositPercent,
    depositAmount,
    balanceAmount,
    deliveryTimeline,
    termsNote,
    rulesVersion: RULES_VERSION,
    validUntil,
    quoteRequired: false,
  };
}
