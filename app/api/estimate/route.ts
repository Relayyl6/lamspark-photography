import { NextRequest, NextResponse } from "next/server";
import { calculateEstimate } from "@/lib/estimate/engine";
import { BookingAnswers, SessionTypeSlug } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionType, answers, packageId } = body as {
      sessionType: SessionTypeSlug;
      answers: BookingAnswers;
      packageId?: string;
    };

    if (!sessionType) {
      return NextResponse.json(
        { error: "sessionType is required" },
        { status: 400 }
      );
    }

    const estimate = calculateEstimate(sessionType, answers || {}, packageId);

    return NextResponse.json({
      success: true,
      estimate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to calculate estimate" },
      { status: 500 }
    );
  }
}
