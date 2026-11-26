export type SessionTypeSlug =
  | "toddler"
  | "maternity"
  | "motherhood-bundle"
  | "event"
  | "wedding"
  | "newborn"
  | "family"
  | "couple"
  | "individual-portrait"
  | "official-portrait"
  | "not-sure";

export interface PackageItem {
  id: string;
  sessionType: SessionTypeSlug;
  name: string;
  price: number | null; // null if quote required
  quoteRequired?: boolean;
  inclusions: string[];
  badge?: string;
  sort: number;
  deliveryDaysText: string;
  expressDeliveryAvailable?: boolean;
}

export interface AddOnItem {
  id: string;
  sessionType: SessionTypeSlug | "all";
  name: string;
  price: number;
  kind: "flat" | "per_person" | "percent_of_package" | "per_hour" | "per_image";
  percentValue?: number; // e.g. 50 for 50%
  description?: string;
}

export interface BookingAnswers {
  purpose: string;
  feeling?: string;
  // Session specifics
  packageId?: string;
  peopleCount?: number; // for family / group
  childName?: string;
  childAge?: number | string;
  partnerName?: string;
  weeksPregnant?: number | string;
  locationType?: "studio" | "outside" | "both";
  preferredMonth?: string;
  priorityEditing?: boolean;
  selectedAddOns?: string[]; // IDs of add-ons
  bundleSelected?: boolean;
  expressDelivery?: boolean;
  reelsAddon?: boolean;
  extraHours?: number;
  extraImagesCount?: number;
  additionalFamilyCount?: number;
  additionalChildCount?: number;
  outfits?: number;
  outfitCount?: number;
  selectedDate?: string;
  timeSlot?: string;
  packageName?: string;
  agreedPrice?: number;
  notes?: string;
}

export interface EstimateLineItem {
  id: string;
  label: string;
  detail?: string;
  amount: number;
  isDiscount?: boolean;
}

export interface EstimateResult {
  sessionType: SessionTypeSlug;
  packageName: string;
  lineItems: EstimateLineItem[];
  total: number;
  depositPercent: number;
  depositAmount: number;
  balanceAmount: number;
  deliveryTimeline: string;
  termsNote: string;
  rulesVersion: string;
  validUntil: string; // ISO 8601, 7 days from generation
  quoteRequired: boolean;
}

export type PipelineStage =
  | "enquiry"
  | "agreed_to_price"
  | "deposit_reported"
  | "deposit_paid"
  | "preparation"
  | "confirmed"
  | "shot"
  | "editing"
  | "client_review"
  | "delivered"
  | "closed";

export type WaitingOn = "client" | "us";

export interface AuditEvent {
  id: string;
  actor: string;
  entity: string;
  entityId: string;
  action: string;
  diff?: Record<string, any>;
  timestamp: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  whatsapp_e164: string;
  email?: string;
  instagram_handle?: string;
  source_first: string;
  notes?: string;
  marketing_consent: boolean;
  marketing_consent_at?: string;
  messaging_consent: boolean;
  messaging_consent_at?: string;
  no_celebratory: boolean;
  comfort_note?: string; // Restricted
  created_at: string;
}

export interface EnquiryRecord {
  id: string;
  reference_code: string; // e.g. LS-4F7K
  client_id: string;
  session_type: SessionTypeSlug;
  package_id?: string;
  stage: PipelineStage;
  waiting_on: WaitingOn;
  stage_entered_at: string;
  source: string;
  source_detail?: string;
  custom_quote: boolean;
  purpose_text: string;
  feeling_text?: string;
  answers: BookingAnswers;
  estimate?: EstimateResult;
  deposit_percent?: number;
  deposit_amount?: number;
  balance_amount?: number;
  agreed_price?: number;
  price_agreed_at?: string;
  deposit_reported_at?: string;
  deposit_screenshot_url?: string;
  deposit_paid_at?: string;
  deposit_recorded_by?: string;
  bank_reference?: string;
  payment?: {
    id?: string;
    amountExpected?: number;
    amountRecorded?: number;
    status?: string;
    aiCheck?: Record<string, any>;
    bankReference?: string;
  };
  ai_check?: Record<string, any>;
  closed_reason?: string;
  closed_at?: string;
  created_at: string;
}
