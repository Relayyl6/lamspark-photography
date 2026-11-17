export interface ConsentEntry {
  id: string;
  clientId: string;
  consentType: "messaging" | "marketing_messages" | "image_portfolio" | "image_marketing" | "testimonial";
  granted: boolean;
  wording: string;
  ipAddress?: string;
  recordedAt: string;
}

export interface AssetConsentEligibility {
  canDisplayInPortfolio: boolean;
  canUseInSocialMarketing: boolean;
  reason?: string;
}

/**
 * Checks whether an asset is legally and ethically eligible for portfolio or social marketing.
 * Enforced at service level to guarantee no client photos are published without consent.
 */
export function checkAssetEligibility(consents: ConsentEntry[]): AssetConsentEligibility {
  const portfolioConsent = consents
    .filter((c) => c.consentType === "image_portfolio")
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

  const marketingConsent = consents
    .filter((c) => c.consentType === "image_marketing")
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

  const canPortfolio = !!portfolioConsent?.granted;
  const canMarketing = !!marketingConsent?.granted;

  let reason = undefined;
  if (!canPortfolio && !canMarketing) {
    reason = "Client has not granted image consent for portfolio or social media.";
  } else if (canPortfolio && !canMarketing) {
    reason = "Client consented to portfolio display only (no social media advertising).";
  }

  return {
    canDisplayInPortfolio: canPortfolio,
    canUseInSocialMarketing: canMarketing,
    reason,
  };
}

/**
 * Checks if a testimonial may be publicly rendered on the website or social media.
 */
export function checkTestimonialEligibility(
  hasExplicitConsent: boolean,
  isApprovedByStudio: boolean
): boolean {
  return hasExplicitConsent && isApprovedByStudio;
}
