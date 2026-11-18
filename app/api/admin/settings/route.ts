import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    bankDetails: {
      bankName: process.env.BANK_NAME || "PalmPay",
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || "9064982841",
      accountName: process.env.BANK_ACCOUNT_NAME || "LEONARD OSEGHALE OSELUMHENSE",
    },
    adminEmail: process.env.STUDIO_OWNER_EMAIL || "osemene@lamsparks.com",
    adminName: process.env.STUDIO_OWNER_NAME || "Osemene (Studio Owner)",
    cloudinaryConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
  });
}
