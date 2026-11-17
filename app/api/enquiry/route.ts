import { NextRequest, NextResponse } from "next/server";
import { calculateEstimate } from "@/lib/estimate/engine";
import { BookingAnswers, EnquiryRecord, SessionTypeSlug } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName,
      whatsappPhone,
      clientEmail,
      sessionType,
      answers,
      source = "Website",
      marketingConsent = false,
      messagingConsent = true,
    } = body as {
      clientName: string;
      whatsappPhone: string;
      clientEmail?: string;
      sessionType: SessionTypeSlug;
      answers: BookingAnswers;
      source?: string;
      marketingConsent?: boolean;
      messagingConsent?: boolean;
    };

    if (!clientName || !whatsappPhone || !sessionType) {
      return NextResponse.json(
        { error: "clientName, whatsappPhone, and sessionType are required" },
        { status: 400 }
      );
    }

    // Normalise Nigerian phone number
    let cleanPhone = whatsappPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.slice(1);
    }

    const referenceCode = "LS-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const estimate = calculateEstimate(sessionType, answers || {}, answers?.packageId);
    const now = new Date().toISOString();

    const enquiryRecord: EnquiryRecord = {
      id: `enq-${Date.now()}`,
      reference_code: referenceCode,
      client_id: `cli-${Date.now()}`,
      session_type: sessionType,
      package_id: answers?.packageId,
      stage: "agreed_to_price",
      waiting_on: "client",
      stage_entered_at: now,
      source,
      custom_quote: estimate.quoteRequired,
      purpose_text: answers?.purpose || "Milestone Portrait",
      feeling_text: answers?.feeling,
      answers,
      estimate,
      agreed_price: estimate.total,
      price_agreed_at: now,
      created_at: now,
    };

    return NextResponse.json({
      success: true,
      referenceCode,
      enquiry: enquiryRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit enquiry" },
      { status: 500 }
    );
  }
}
