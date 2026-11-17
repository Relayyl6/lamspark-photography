import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export type MessageTriageLabel =
  | "price_question"
  | "session_inquiry"
  | "rescheduling"
  | "referral"
  | "complaint"
  | "personal"
  | "deposit_submission";

export interface TriageResult {
  label: MessageTriageLabel;
  confidence: number;
  suggestedAction: string;
  summary: string;
}

export interface ScreenshotCheckResult {
  detectedAmount: number | null;
  detectedDate: string | null;
  detectedReference: string | null;
  detectedSender: string | null;
  expectedAmount: number;
  amountMatches: boolean;
  notes: string;
}

export interface ReceiptAnalysisResult {
  success: boolean;
  extractedAmount: number | null;
  detectedBank: string | null;
  senderName: string | null;
  reference: string | null;
  date: string | null;
  confidence: "high" | "medium" | "low" | "none";
  humanVerificationRequired: true;
  summary: string;
  error?: string;
}

// User specification: "USE THE BEST MODELS FIRST AND THE SECOND BEST AND REST AS PER BACKUP"
const GEMINI_MODELS_FALLBACK_CHAIN = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-pro-latest",
  "gemini-flash-latest",
];

function getApiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_AI_API_KEY environment variable is not configured.");
  }
  return key;
}

/**
 * Universal Gemini API caller with automatic fallback across the model hierarchy
 */
export async function callGemini(contents: any[]): Promise<string> {
  const apiKey = getApiKey();
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS_FALLBACK_CHAIN) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Model ${model} returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Continue to next model in fallback chain
    }
  }

  throw lastError || new Error("All Gemini models in fallback chain failed.");
}

/**
 * Multimodal OCR & Receipt Inspector using Gemini Vision
 * Extracts bank transfer details strictly from customer screenshots.
 * Never hallucinates or fabricates reference numbers, banks, or amounts.
 */
export async function analyzeReceiptWithGemini(
  base64Image: string,
  mimeType: string = "image/png"
): Promise<ReceiptAnalysisResult> {
  try {
    const prompt = `You are a financial verification OCR assistant for LamSparks Photography (Abuja, Nigeria).
Analyze this Nigerian bank transfer receipt/screenshot.
Extract only what is clearly and visibly present. Do not guess or fabricate information.
Return strict JSON format without Markdown formatting:
{
  "amount": number or null (integer in Naira if clearly stated, otherwise null),
  "bank": string or null (name of sending or receiving bank if visible, otherwise null),
  "sender": string or null (name of sender if visible, otherwise null),
  "reference": string or null (transaction/session reference ID if clearly visible, otherwise null),
  "date": string or null (date of transaction if visible, otherwise null),
  "confidence": "high" | "medium" | "low",
  "summary": string (concise objective factual description of what was extracted)
}`;

    const contents = [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ];

    const rawJson = await callGemini(contents);
    const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      success: true,
      extractedAmount: typeof parsed.amount === "number" ? parsed.amount : null,
      detectedBank: typeof parsed.bank === "string" ? parsed.bank : null,
      senderName: typeof parsed.sender === "string" ? parsed.sender : null,
      reference: typeof parsed.reference === "string" ? parsed.reference : null,
      date: typeof parsed.date === "string" ? parsed.date : null,
      confidence: parsed.confidence || "medium",
      humanVerificationRequired: true, // HARD RULE: AI never confirms deposit alone
      summary: parsed.summary || "Receipt analyzed. Staff confirmation required.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      extractedAmount: null,
      detectedBank: null,
      senderName: null,
      reference: null,
      date: null,
      confidence: "none",
      humanVerificationRequired: true,
      summary: "Automated OCR could not extract receipt details. Studio staff must manually inspect screenshot and input verified bank reference.",
      error: errorMsg,
    };
  }
}

/**
 * Editorial Studio Response Drafter
 * Drafts bespoke, warm, magazine-editorial replies for staff to review in Studio Inbox.
 */
export async function draftEditorialReply(
  incomingMessage: string,
  clientName: string = "Friend",
  sessionType: string = "portrait"
): Promise<string> {
  const prompt = `You are the executive studio assistant for LamSparks Photography Abuja, owned by Osemene.
The brand voice is: warm, refined, editorial, gentle, calm, like a luxury art magazine.
NEVER sound like a fast-food delivery service or chatbot. Do not mention countdowns, carts, or rigid bots.
Client Name: ${clientName}
Session Interest: ${sessionType}
Client's Message: "${incomingMessage}"

Draft a short, elegant, warm response (2 to 4 sentences) for the studio team to send on WhatsApp.`;

  const contents = [{ parts: [{ text: prompt }] }];
  return await callGemini(contents);
}

/**
 * Background AI Helper 1: Inbox Triage
 * Analyzes client inbound message and suggests a categorization label and summary.
 * Client NEVER talks to AI directly. Output is presented only to studio team in human inbox.
 */
export function triageInboundMessage(messageText: string): TriageResult {
  const lower = messageText.toLowerCase();

  if (lower.includes("paid") || lower.includes("transfer") || lower.includes("screenshot") || lower.includes("receipt")) {
    return {
      label: "deposit_submission",
      confidence: 0.95,
      suggestedAction: "Check deposit queue to inspect payment screenshot against bank statement.",
      summary: "Client reporting bank transfer/deposit payment.",
    };
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much") || lower.includes("rate") || lower.includes("fee")) {
    return {
      label: "price_question",
      confidence: 0.92,
      suggestedAction: "Direct client to two-step estimate builder or share catalog starting rates.",
      summary: "Client inquiring about package pricing and fees.",
    };
  }

  if (lower.includes("reschedule") || lower.includes("postpone") || lower.includes("change date") || lower.includes("another day")) {
    return {
      label: "rescheduling",
      confidence: 0.9,
      suggestedAction: "Check 48-hour policy window and studio calendar availability.",
      summary: "Client requesting shoot date change or rescheduling.",
    };
  }

  if (lower.includes("unhappy") || lower.includes("delay") || lower.includes("issue") || lower.includes("wrong") || lower.includes("disappointed")) {
    return {
      label: "complaint",
      confidence: 0.88,
      suggestedAction: "Route immediately to Osemene (Owner) for personal, prioritized response.",
      summary: "Client expressing concern or delay issue.",
    };
  }

  if (lower.includes("referred") || lower.includes("recommended") || lower.includes("told me about you")) {
    return {
      label: "referral",
      confidence: 0.85,
      suggestedAction: "Note referral source and warmly welcome to LamSparks.",
      summary: "Client referred by existing client or collaborator.",
    };
  }

  return {
    label: "session_inquiry",
    confidence: 0.8,
    suggestedAction: "Review session specifics and guide through personal booking journey.",
    summary: "General enquiry about photography sessions and availability.",
  };
}

/**
 * Background AI Helper 2: Deposit Screenshot Checking
 * Strictly adheres to Hard Rule #1: The AI NEVER confirms or records a deposit.
 * It solely highlights whether expected fields match for human review.
 */
export function checkDepositScreenshot(
  extractedText: string,
  expectedDepositAmount: number
): ScreenshotCheckResult {
  const amountRegex = /(?:₦|ngn|naira|\b)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]{4,9})\b/gi;
  const matches = Array.from(extractedText.matchAll(amountRegex));

  let detectedAmount: number | null = null;
  for (const m of matches) {
    const cleaned = m[1].replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 10000 && parsed <= 5000000) {
      if (detectedAmount === null || Math.abs(parsed - expectedDepositAmount) < Math.abs(detectedAmount - expectedDepositAmount)) {
        detectedAmount = parsed;
      }
    }
  }

  const refRegex = /\b(?:ref|reference|session|txn|trans id|id)[:\s]*([a-z0-9\-_]{8,35})\b/i;
  const refMatch = extractedText.match(refRegex);
  const detectedReference = refMatch ? refMatch[1] : null;

  const dateRegex = /\b([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+[0-9]{1,2},?\s+[0-9]{4})\b/i;
  const dateMatch = extractedText.match(dateRegex);
  const detectedDate = dateMatch ? dateMatch[1] : null;

  const amountMatches = detectedAmount !== null && Math.abs(detectedAmount - expectedDepositAmount) < 1;

  let notes = "";
  if (amountMatches) {
    notes = `Extracted amount ₦${detectedAmount?.toLocaleString()} matches expected deposit ₦${expectedDepositAmount.toLocaleString()}.`;
  } else if (detectedAmount !== null) {
    notes = `Attention: Extracted amount ₦${detectedAmount.toLocaleString()} differs from expected deposit ₦${expectedDepositAmount.toLocaleString()}.`;
  } else {
    notes = "Could not cleanly detect numeric amount from screenshot. Manual human verification required.";
  }

  return {
    detectedAmount,
    detectedDate,
    detectedReference,
    detectedSender: null,
    expectedAmount: expectedDepositAmount,
    amountMatches,
    notes,
  };
}
