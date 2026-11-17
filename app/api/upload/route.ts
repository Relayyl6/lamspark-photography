import { NextRequest, NextResponse } from "next/server";
import { uploadObject, PUBLIC_BUCKET, PRIVATE_BUCKET, getPrivateObjectUrl } from "@/lib/storage";
import { db } from "@/db";
import { assets, payments } from "@/db/schema";
import { analyzeReceiptWithGemini } from "@/lib/ai/service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const partition = (formData.get("partition") as string) || "public";
    const enquiryId = formData.get("enquiryId") as string | null;
    const sessionType = formData.get("sessionType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const uniqueId = crypto.randomUUID();
    const safeFilename = `${uniqueId}.${ext}`;

    if (partition === "private") {
      // Store in private bucket (e.g. transfer screenshot)
      const storageKey = `receipts/${safeFilename}`;
      await uploadObject({
        bucket: PRIVATE_BUCKET,
        key: storageKey,
        body: buffer,
        contentType: file.type || "image/png",
      });

      // Save asset record
      const [newAsset] = await db
        .insert(assets)
        .values({
          storageKey,
          storageBucket: PRIVATE_BUCKET,
          kind: "receipt",
          sessionType: sessionType || "general",
          altText: `Bank transfer receipt for enquiry ${enquiryId || "general"}`,
        })
        .returning();

      // Analyze receipt image with Gemini Vision OCR
      const base64Image = buffer.toString("base64");
      const aiResult = await analyzeReceiptWithGemini(base64Image, file.type || "image/png");

      // If enquiryId is provided, record reported payment
      if (enquiryId) {
        await db.insert(payments).values({
          enquiryId,
          kind: "deposit",
          amountExpected: aiResult.extractedAmount || 0,
          status: "reported", // HARD RULE: assistant never auto-confirms deposit
          screenshotAssetId: newAsset.id,
          aiCheck: aiResult,
          bankReference: aiResult.reference || null, // null unless clearly extracted
        });
      }

      const signedUrl = await getPrivateObjectUrl(storageKey, 3600);

      return NextResponse.json({
        success: true,
        assetId: newAsset.id,
        storageKey,
        privateUrl: signedUrl,
        aiCheck: aiResult,
        message: "Receipt uploaded to secure storage. Pending human studio verification.",
      });
    }

    // Public bucket
    const storageKey = `portfolio/${safeFilename}`;
    const publicUrl = await uploadObject({
      bucket: PUBLIC_BUCKET,
      key: storageKey,
      body: buffer,
      contentType: file.type || "image/jpeg",
    });

    const [newAsset] = await db
      .insert(assets)
      .values({
        storageKey,
        storageBucket: PUBLIC_BUCKET,
        kind: "image",
        sessionType: sessionType || "general",
        consentStatus: "portfolio",
        altText: file.name,
      })
      .returning();

    return NextResponse.json({
      success: true,
      assetId: newAsset.id,
      url: publicUrl,
    });
  } catch (err: unknown) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload processing failed" },
      { status: 500 }
    );
  }
}
