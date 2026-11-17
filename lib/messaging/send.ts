export interface MessageSendRequest {
  clientId: string;
  recipientPhone: string;
  templateName: string;
  variables: Record<string, string>;
  category: "utility" | "marketing";
  messagingConsentGranted: boolean;
  marketingConsentGranted: boolean;
  isStopListed?: boolean;
  lastInboundTimestamp?: string; // for 24h window
  currentTimeIso?: string;
  actor?: "system" | "human";
}

export interface MessageSendResult {
  success: boolean;
  status: "sent" | "queued" | "blocked";
  reason?: string;
  renderedBody?: string;
}

// Default sending hours: 09:00 to 19:00 (9am to 7pm) Africa/Lagos
const SENDING_START_HOUR = 9;
const SENDING_END_HOUR = 19;

export const APPROVED_TEMPLATES: Record<
  string,
  { body: string; requiredVars: string[]; approvedByOwner: boolean; category: "utility" | "marketing" }
> = {
  deposit_received: {
    body: "Hello {{name}}, we have received your deposit screenshot for your {{session_type}} session (Ref: {{ref_code}}). A team member will verify it against our studio account shortly.",
    requiredVars: ["name", "session_type", "ref_code"],
    approvedByOwner: true,
    category: "utility",
  },
  deposit_confirmed: {
    body: "Dear {{name}}, your deposit for your {{session_type}} session is confirmed! Your studio time is reserved. Please complete your gentle prep details here: {{prep_link}}",
    requiredVars: ["name", "session_type", "prep_link"],
    approvedByOwner: true,
    category: "utility",
  },
  shoot_reminder_2days: {
    body: "Hello {{name}}, your {{session_type}} shoot with LamSparks is in 2 days at {{time}}! Location: {{location}}. We are excited to capture your story.",
    requiredVars: ["name", "session_type", "time", "location"],
    approvedByOwner: true,
    category: "utility",
  },
  gallery_delivered: {
    body: "Dear {{name}}, your LamSparks gallery is ready to view and download: {{gallery_link}}. We loved preserving these moments for you.",
    requiredVars: ["name", "gallery_link"],
    approvedByOwner: true,
    category: "utility",
  },
  marketing_greeting: {
    body: "Warmest greetings from LamSparks, {{name}}! Wishing you and your family sparkle and joy this season.",
    requiredVars: ["name"],
    approvedByOwner: true,
    category: "marketing",
  },
};

/**
 * Validates and dispatches or queues a WhatsApp message.
 * Strict guards:
 * - STOP list check
 * - Variable completeness (fail-closed if any variable is blank/missing)
 * - Consent check (messaging consent for utility, marketing consent for marketing)
 * - Sending hours check (09:00 - 19:00 Lagos)
 * - Template approval gate
 */
export function sendMessage(request: MessageSendRequest): MessageSendResult {
  // 1. STOP check
  if (request.isStopListed) {
    return {
      success: false,
      status: "blocked",
      reason: "Client has requested STOP. All automated messages are permanently withheld.",
    };
  }

  // 2. Consent check
  if (!request.messagingConsentGranted) {
    return {
      success: false,
      status: "blocked",
      reason: "Messaging consent has not been granted by this client.",
    };
  }

  if (request.category === "marketing" && !request.marketingConsentGranted) {
    return {
      success: false,
      status: "blocked",
      reason: "Marketing consent has not been granted for promotional/greeting messages.",
    };
  }

  // 3. Template existence and owner approval gate
  const template = APPROVED_TEMPLATES[request.templateName];
  if (!template) {
    return {
      success: false,
      status: "blocked",
      reason: `Unknown template '${request.templateName}'.`,
    };
  }

  if (!template.approvedByOwner) {
    return {
      success: false,
      status: "blocked",
      reason: `Template '${request.templateName}' has not been approved by Osemene (Owner approval gate).`,
    };
  }

  // 4. Variable validation - fail closed if any required variable is blank or missing
  for (const v of template.requiredVars) {
    const val = request.variables[v];
    if (!val || val.trim().length === 0) {
      return {
        success: false,
        status: "blocked",
        reason: `Blank or missing variable '{{${v}}}'. Messages must never send with unrendered tokens.`,
      };
    }
  }

  // 5. Render message body
  let rendered = template.body;
  for (const [k, v] of Object.entries(request.variables)) {
    rendered = rendered.replaceAll(`{{${k}}}`, v.trim());
  }

  // 6. Sending hours check (Lagos time UTC+1)
  const date = request.currentTimeIso ? new Date(request.currentTimeIso) : new Date();
  // Africa/Lagos is UTC+1
  const lagosHour = (date.getUTCHours() + 1) % 24;

  if (lagosHour < SENDING_START_HOUR || lagosHour >= SENDING_END_HOUR) {
    return {
      success: true,
      status: "queued",
      reason: `Outside allowed sending hours (09:00 to 19:00 Lagos). Message queued for morning delivery.`,
      renderedBody: rendered,
    };
  }

  return {
    success: true,
    status: "sent",
    renderedBody: rendered,
  };
}
