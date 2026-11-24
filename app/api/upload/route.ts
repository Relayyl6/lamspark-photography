import { NextRequest, NextResponse } from "next/server";
import { uploadObject, PUBLIC_BUCKET, PRIVATE_BUCKET, getPrivateObjectUrl } from "@/lib/storage";
import { db } from "@/db";
import { assets, payments } from "@/db/schema";
import { analyzeReceiptWithGemini, verifyDepositAccounting } from "@/lib/ai/service";
import crypto from "crypto";
import fs from "fs";
import path from "path";

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
      let storageKey = `receipts/${safeFilename}`;
      let signedUrl = "";

      try {
        await uploadObject({
          bucket: PRIVATE_BUCKET,
          key: storageKey,
          body: buffer,
          contentType: file.type || "image/png",
        });
        signedUrl = await getPrivateObjectUrl(storageKey, 3600);
      } catch (s3Err) {
        console.warn("Private S3 upload fallback to local storage:", s3Err);
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, safeFilename), buffer);
        storageKey = `/uploads/${safeFilename}`;
        signedUrl = storageKey;
      }

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
      let aiResult: any = { extractedAmount: null, reference: null, confidence: "low" };
      try {
        const base64Image = buffer.toString("base64");
        aiResult = await analyzeReceiptWithGemini(base64Image, file.type || "image/png");
      } catch (aiErr) {
        console.warn("AI receipt analysis skipped:", aiErr);
      }

      const expectedDeposit = Number(formData.get("expectedDeposit")) || 0;
      const totalAmount = Number(formData.get("totalAmount")) || 0;
      let accountingCheck = null;
      if (expectedDeposit > 0) {
        accountingCheck = verifyDepositAccounting(aiResult, expectedDeposit, totalAmount || undefined);
      }

      const combinedAiCheck = {
        ...aiResult,
        accountingCheck,
      };

      // If enquiryId is provided, record reported payment
      if (enquiryId) {
        await db.insert(payments).values({
          enquiryId,
          kind: "deposit",
          amountExpected: expectedDeposit || aiResult.extractedAmount || 0,
          amountRecorded: aiResult.extractedAmount || null,
          status: "reported",
          screenshotAssetId: newAsset.id,
          aiCheck: combinedAiCheck,
          bankReference: aiResult.reference || null,
        });
      }

      return NextResponse.json({
        success: true,
        assetId: newAsset.id,
        storageKey,
        privateUrl: signedUrl,
        url: signedUrl,
        aiCheck: combinedAiCheck,
        message: "Receipt uploaded and analyzed by AI successfully.",
      });
    }

    // Public asset (Portfolio, Event Galleries, Studio Content)
    let processedBuffer = buffer;
    let finalContentType = file.type || "image/jpeg";
    let finalSafeFilename = safeFilename;

    // Automatic Studio Image Optimization: Auto-rotate EXIF, cap at 4K (2560px), encode to high-fidelity WebP
    if (partition === "public" && (file.type?.startsWith("image/") || /\.(jpe?g|png|webp|heic|tiff)$/i.test(file.name))) {
      try {
        const sharp = require("sharp");
        processedBuffer = await sharp(buffer)
          .rotate() // Automatically orient camera photos based on EXIF tag
          .resize({
            width: 2560,
            height: 2560,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 86, effort: 4 })
          .toBuffer();

        finalContentType = "image/webp";
        finalSafeFilename = `${uniqueId}.webp`;
      } catch (sharpErr) {
        console.warn("Sharp image optimization fallback to raw buffer:", sharpErr);
        processedBuffer = buffer;
      }
    }

    let storageKey = `portfolio/${finalSafeFilename}`;
    let publicUrl = "";

    try {
      publicUrl = await uploadObject({
        bucket: PUBLIC_BUCKET,
        key: storageKey,
        body: processedBuffer,
        contentType: finalContentType,
      });
    } catch (s3Err) {
      console.warn("Public S3 upload fallback to local storage:", s3Err);
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, finalSafeFilename), processedBuffer);
      storageKey = `/uploads/${finalSafeFilename}`;
      publicUrl = storageKey;
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        storageKey: publicUrl,
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
      storageKey: publicUrl,
    });
  } catch (err: unknown) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload processing failed" },
      { status: 500 }
    );
  }
}
