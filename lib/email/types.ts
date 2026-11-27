export interface EstimateLineItem {
  label: string;
  amount: number;
  category?: string;
}

export interface BookingEmailContext {
  enquiryId: string;
  referenceCode: string;
  sessionType: string;
  sessionTitle: string;
  stage: string;
  bookingStatus: string;
  shootStart: string | null;
  shootEnd: string | null;
  shootDateFormatted: string | null;
  shootTimeSlot: string | null;
  rescheduleCount: number;
  locationType: string;
  locationDetail: string;
  holdExpiresAt: string | null;
  closedReason: string | null;
  purposeText: string | null;
  feelingText: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    whatsapp: string;
  };
  answers: Record<string, any>;
  estimate: {
    total: number;
    depositPercent: number;
    depositAmount: number;
    balanceAmount: number;
    lineItems: EstimateLineItem[];
  };
  payment: {
    id: string | null;
    status: string | null;
    amountExpected: number;
    amountRecorded: number;
    bankReference: string | null;
    recordedBy: string | null;
    recordedAt: string | null;
  };
}

export type EmailPipelineEvent =
  | "hold_started"
  | "hold_ended"
  | "agreed_to_price"
  | "deposit_reported"
  | "deposit_confirmed"
  | "rescheduled"
  | "cancelled"
  | "stage_updated"
  | "receipt_issued";

export const STUDIO_BUSINESS_INFO = {
  name: "LamSparks Photography",
  shortName: "LamSparks.",
  ownerName: "Osemene",
  location: "Maitama Private Studio, FCT, Abuja, Nigeria",
  shortLocation: "FCT, ABUJA",
  phone: "+234 813 084 7299",
  displayPhone: "08130847299",
  whatsappUrl: "https://wa.me/2348130847299",
  email: "Lamsparksphotography@gmail.com",
  socialHandle: "@lamsparksphotography",
  bankName: process.env.BANK_NAME || "Fidelity Bank",
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || "5601662438",
  accountName: process.env.BANK_ACCOUNT_NAME || "Lamsparks Photography",
  terms: "No refund after payment is made.",
};
