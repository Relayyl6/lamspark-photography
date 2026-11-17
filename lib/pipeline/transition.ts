import type { PipelineStage, AuditEvent, EnquiryRecord } from "../types";

export interface TransitionResult {
  success: boolean;
  error?: string;
  enquiry?: EnquiryRecord;
  auditEvent?: AuditEvent;
}

// Map of allowed forward and backward moves
const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  enquiry: ["agreed_to_price", "deposit_reported", "closed"],
  agreed_to_price: ["deposit_reported", "enquiry", "closed"],
  deposit_reported: ["deposit_paid", "agreed_to_price", "closed"],
  deposit_paid: ["preparation", "confirmed", "closed"],
  preparation: ["confirmed", "shot", "closed"],
  confirmed: ["preparation", "shot", "closed"],
  shot: ["editing", "closed"],
  editing: ["client_review", "closed"],
  client_review: ["delivered", "editing", "closed"],
  delivered: ["closed"],
  closed: ["enquiry", "agreed_to_price", "deposit_paid"], // Can be reopened
};

/**
 * State machine transition service.
 * Enforces guards, updates waiting_on flags, and generates an audit log entry.
 */
export function transitionEnquiry(
  enquiry: EnquiryRecord,
  toStage: PipelineStage,
  actor: string,
  options?: {
    reason?: string;
    depositRecordedBy?: string;
    bankReference?: string;
    depositAmount?: number;
  }
): TransitionResult {
  // Allow remaining in same stage (no-op)
  if (enquiry.stage === toStage) {
    return { success: true, enquiry };
  }

  // Check allowed stage transitions
  const allowed = ALLOWED_TRANSITIONS[enquiry.stage] || [];
  if (!allowed.includes(toStage)) {
    return {
      success: false,
      error: `Transition from '${enquiry.stage}' to '${toStage}' is not permitted by pipeline policy.`,
    };
  }

  // Hard Rule Guard: Deposit Paid can NEVER be automatic and requires human recording
  if (toStage === "deposit_paid") {
    if (!options?.depositRecordedBy && !enquiry.deposit_recorded_by) {
      return {
        success: false,
        error: "Hard rule violation: A deposit can never be confirmed automatically. A team member must verify against bank records and supply their identity.",
      };
    }
  }

  // Guard: Closing requires a reason
  if (toStage === "closed" && !options?.reason && !enquiry.closed_reason) {
    return {
      success: false,
      error: "Closing an enquiry card requires a documented reason (e.g. price, date unavailable, no response).",
    };
  }

  const now = new Date().toISOString();
  const previousStage = enquiry.stage;

  // Determine waiting_on
  let nextWaitingOn: "client" | "us" = "client";
  switch (toStage) {
    case "enquiry":
      nextWaitingOn = enquiry.custom_quote ? "us" : "client";
      break;
    case "agreed_to_price":
      nextWaitingOn = "client"; // waiting for client to transfer deposit
      break;
    case "deposit_reported":
      nextWaitingOn = "us"; // waiting for studio team to verify bank transfer
      break;
    case "deposit_paid":
      nextWaitingOn = "us"; // studio to send preparation link
      break;
    case "preparation":
      nextWaitingOn = "client"; // client completing questionnaire & outfit prep
      break;
    case "confirmed":
      nextWaitingOn = "us"; // studio shoot date locked
      break;
    case "shot":
      nextWaitingOn = "us"; // studio culling & editing
      break;
    case "editing":
      nextWaitingOn = "us"; // studio editing
      break;
    case "client_review":
      nextWaitingOn = "client"; // client selecting/viewing gallery
      break;
    case "delivered":
      nextWaitingOn = "client";
      break;
    case "closed":
      nextWaitingOn = "us";
      break;
  }

  const updatedEnquiry: EnquiryRecord = {
    ...enquiry,
    stage: toStage,
    waiting_on: nextWaitingOn,
    stage_entered_at: now,
    closed_reason: toStage === "closed" ? options?.reason : undefined,
    closed_at: toStage === "closed" ? now : undefined,
    deposit_recorded_by: options?.depositRecordedBy || enquiry.deposit_recorded_by,
    deposit_paid_at: toStage === "deposit_paid" ? now : enquiry.deposit_paid_at,
    bank_reference: options?.bankReference || enquiry.bank_reference,
  };

  const auditEvent: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor,
    entity: "enquiry",
    entityId: enquiry.id,
    action: `stage_change:${previousStage}->${toStage}`,
    diff: {
      from: previousStage,
      to: toStage,
      reason: options?.reason,
      depositRecordedBy: options?.depositRecordedBy,
    },
    timestamp: now,
  };

  return {
    success: true,
    enquiry: updatedEnquiry,
    auditEvent,
  };
}
