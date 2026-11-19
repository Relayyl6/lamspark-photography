import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export type MessageCategory = "business" | "personal" | "automated";

export type MessageTriageLabel =
  | "price_question"
  | "session_inquiry"
  | "rescheduling"
  | "referral"
  | "complaint"
  | "personal"
  | "deposit_submission"
  | "spam";

export interface ModelVote {
  model: string;
  category: MessageCategory;
  label: MessageTriageLabel;
  isBusiness: boolean;
  confidence: number;
  reasoning: string;
}

export interface TriageResult {
  category: MessageCategory;
  isBusiness: boolean;
  label: MessageTriageLabel;
  confidence: number;
  suggestedAction: string;
  summary: string;
  highlightAlert?: string | null;
  aiConsensus?: {
    totalModels: number;
    agreeingModels: number;
    agreementPercentage: number;
    consensusSummary: string;
    modelVotes: ModelVote[];
  };
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
  recipientBank: string | null;
  recipientAccount: string | null;
  recipientName: string | null;
  senderName: string | null;
  reference: string | null;
  date: string | null;
  confidence: "high" | "medium" | "low" | "none";
  humanVerificationRequired: true;
  summary: string;
  accountingCheck?: AccountingVerificationResult;
  error?: string;
}

export interface AccountingVerificationResult {
  expectedAmount: number;
  extractedAmount: number | null;
  status: "exact_match" | "full_session_paid" | "shortfall" | "beneficiary_mismatch" | "duplicate_reference" | "unverified";
  amountMatches: boolean;
  isOfficialAccount: boolean;
  shortfall: number;
  surplus: number;
  badge: {
    label: string;
    variant: "success" | "warning" | "danger" | "info";
  };
  notes: string;
}

export const OFFICIAL_STUDIO_BANK = {
  bankName: "Fidelity Bank",
  accountNumber: "5601662438",
  accountName: "Lamsparks Photography",
};

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
 * Checks receiving bank against Lamsparks Photography Fidelity Bank account (5601662438).
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
  "bank": string or null (name of sending bank if visible, otherwise null),
  "recipientBank": string or null (name of receiving bank e.g. Fidelity Bank, otherwise null),
  "recipientAccount": string or null (account number of beneficiary if visible, otherwise null),
  "recipientName": string or null (name of beneficiary e.g. Lamsparks Photography, otherwise null),
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

    const extractedAmount = typeof parsed.amount === "number" ? parsed.amount : null;
    const recipientBank = typeof parsed.recipientBank === "string" ? parsed.recipientBank : null;
    const recipientAccount = typeof parsed.recipientAccount === "string" ? parsed.recipientAccount : null;
    const recipientName = typeof parsed.recipientName === "string" ? parsed.recipientName : null;

    return {
      success: true,
      extractedAmount,
      detectedBank: typeof parsed.bank === "string" ? parsed.bank : null,
      recipientBank,
      recipientAccount,
      recipientName,
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
      recipientBank: null,
      recipientAccount: null,
      recipientName: null,
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
 * Intelligent Accounting Verification
 * Checks:
 * 1. Shortfall (underpayment) vs Expected Deposit
 * 2. 100% Full Session Payment (covers full price)
 * 3. Beneficiary mismatch (did client pay into wrong bank instead of Fidelity 5601662438?)
 */
export function verifyDepositAccounting(
  analysis: Partial<ReceiptAnalysisResult>,
  expectedDeposit: number,
  fullTotal?: number
): AccountingVerificationResult {
  const extracted = analysis.extractedAmount ?? null;
  const recipBank = (analysis.recipientBank || "").toLowerCase();
  const recipAcc = (analysis.recipientAccount || "").replace(/\D/g, "");
  const recipName = (analysis.recipientName || "").toLowerCase();

  // 1. Check Beneficiary Account
  let isOfficialAccount = true;
  let beneficiaryMismatch = false;

  if (recipAcc && recipAcc !== OFFICIAL_STUDIO_BANK.accountNumber) {
    isOfficialAccount = false;
    beneficiaryMismatch = true;
  } else if (recipBank && !recipBank.includes("fidelity") && !recipName.includes("lamsparks")) {
    // If bank is explicitly stated and not Fidelity or Lamsparks
    isOfficialAccount = false;
    beneficiaryMismatch = true;
  }

  if (beneficiaryMismatch) {
    return {
      expectedAmount: expectedDeposit,
      extractedAmount: extracted,
      status: "beneficiary_mismatch",
      amountMatches: false,
      isOfficialAccount: false,
      shortfall: 0,
      surplus: 0,
      badge: {
        label: "🚨 Beneficiary Mismatch",
        variant: "danger",
      },
      notes: `Receipt shows transfer to ${analysis.recipientBank || "Unknown Bank"} (Acc: ${analysis.recipientAccount || "Unclear"}). Does NOT match official Fidelity Bank account 5601662438 (Lamsparks Photography).`,
    };
  }

  // 2. If amount wasn't cleanly extracted
  if (extracted === null || isNaN(extracted)) {
    return {
      expectedAmount: expectedDeposit,
      extractedAmount: null,
      status: "unverified",
      amountMatches: false,
      isOfficialAccount,
      shortfall: expectedDeposit,
      surplus: 0,
      badge: {
        label: "⚠️ Manual Audit Required",
        variant: "warning",
      },
      notes: "Could not cleanly detect numeric amount from screenshot. Studio staff must manually check bank statement.",
    };
  }

  // 3. Full Session Payment (covers entire photoshoot total)
  if (fullTotal && extracted >= fullTotal) {
    return {
      expectedAmount: expectedDeposit,
      extractedAmount: extracted,
      status: "full_session_paid",
      amountMatches: true,
      isOfficialAccount,
      shortfall: 0,
      surplus: extracted - fullTotal,
      badge: {
        label: "⭐ 100% Full Payment",
        variant: "info",
      },
      notes: `Full session payment detected (₦${extracted.toLocaleString()}). Exceeds required deposit and covers entire ₦${fullTotal.toLocaleString()} session fee. Balance remaining at shoot: ₦0.`,
    };
  }

  // 4. Exact Deposit Match
  const diff = extracted - expectedDeposit;
  if (Math.abs(diff) < 10) {
    return {
      expectedAmount: expectedDeposit,
      extractedAmount: extracted,
      status: "exact_match",
      amountMatches: true,
      isOfficialAccount,
      shortfall: 0,
      surplus: 0,
      badge: {
        label: "✅ Exact Deposit Match",
        variant: "success",
      },
      notes: `Extracted ₦${extracted.toLocaleString()} matches expected deposit of ₦${expectedDeposit.toLocaleString()} exactly.`,
    };
  }

  // 5. Shortfall (underpayment)
  if (extracted < expectedDeposit) {
    const deficit = expectedDeposit - extracted;
    return {
      expectedAmount: expectedDeposit,
      extractedAmount: extracted,
      status: "shortfall",
      amountMatches: false,
      isOfficialAccount,
      shortfall: deficit,
      surplus: 0,
      badge: {
        label: `⚠️ Shortfall (Deficit: ₦${deficit.toLocaleString()})`,
        variant: "warning",
      },
      notes: `Payment shortfall: Client paid ₦${extracted.toLocaleString()}, but required deposit is ₦${expectedDeposit.toLocaleString()}. Deficit of ₦${deficit.toLocaleString()} remaining.`,
    };
  }

  // 6. Overpayment on Deposit
  return {
    expectedAmount: expectedDeposit,
    extractedAmount: extracted,
    status: "exact_match",
    amountMatches: true,
    isOfficialAccount,
    shortfall: 0,
    surplus: diff,
    badge: {
      label: `✅ Deposit Covered (+₦${diff.toLocaleString()})`,
      variant: "success",
    },
    notes: `Extracted ₦${extracted.toLocaleString()} exceeds required deposit of ₦${expectedDeposit.toLocaleString()} by ₦${diff.toLocaleString()}.`,
  };
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
/**
 * Background AI Helper 1: Inbox Triage & Business vs. Personal Classifier
 * Protects studio privacy: classifies whether an incoming message on WhatsApp/Instagram
 * is business-related (photography inquiry, deposit, booking, pricing) or personal
 * (friends, family, casual chit-chat, OTPs).
 *
 * Client NEVER talks to AI directly. Output is presented only to studio team in human inbox.
 */
export function triageInboundMessage(messageText: string): TriageResult {
  const lower = messageText.toLowerCase().trim();

  // 1. Automated System Notifications & OTPs
  if (
    lower.includes("otp") ||
    lower.includes("verification code") ||
    lower.includes("one-time password") ||
    lower.includes("authorization code") ||
    lower.includes("security code") ||
    lower.includes("login attempt")
  ) {
    return {
      category: "automated",
      isBusiness: false,
      label: "spam",
      confidence: 0.99,
      suggestedAction: "Automated verification / system security code. Filtered from client queue.",
      summary: "Automated OTP or security code.",
      highlightAlert: "🤖 Automated Code / OTP",
    };
  }

  // 2. Deposit Submission & Payment Reporting
  if (
    lower.includes("paid") ||
    lower.includes("transfer") ||
    lower.includes("screenshot") ||
    lower.includes("receipt") ||
    lower.includes("fidelity") ||
    lower.includes("deposit") ||
    lower.includes("proof of payment") ||
    lower.includes("sent the money") ||
    lower.includes("payment made") ||
    lower.includes("alert")
  ) {
    return {
      category: "business",
      isBusiness: true,
      label: "deposit_submission",
      confidence: 0.96,
      suggestedAction: "Check deposit queue to inspect payment screenshot against Fidelity Bank statement (5601662438).",
      summary: "Client reporting bank transfer/deposit payment.",
      highlightAlert: "📸 Deposit / Payment Reported",
    };
  }

  // 3. Price & Package Inquiries
  if (
    lower.includes("price") ||
    lower.includes("pricing") ||
    lower.includes("cost") ||
    lower.includes("how much") ||
    lower.includes("rate") ||
    lower.includes("rates") ||
    lower.includes("fee") ||
    lower.includes("fees") ||
    lower.includes("package") ||
    lower.includes("packages") ||
    lower.includes("quote") ||
    lower.includes("budget")
  ) {
    return {
      category: "business",
      isBusiness: true,
      label: "price_question",
      confidence: 0.93,
      suggestedAction: "Direct client to two-step estimate builder or share catalog starting rates.",
      summary: "Client inquiring about package pricing and fees.",
      highlightAlert: "💰 Pricing Inquiry",
    };
  }

  // 4. Rescheduling & Date Changes
  if (
    lower.includes("reschedule") ||
    lower.includes("postpone") ||
    lower.includes("change date") ||
    lower.includes("another day") ||
    lower.includes("shift date") ||
    lower.includes("different date")
  ) {
    return {
      category: "business",
      isBusiness: true,
      label: "rescheduling",
      confidence: 0.91,
      suggestedAction: "Check 48-hour policy window and studio calendar availability.",
      summary: "Client requesting shoot date change or rescheduling.",
      highlightAlert: "📅 Rescheduling Request",
    };
  }

  // 5. Complaints & Issues
  if (
    lower.includes("unhappy") ||
    lower.includes("delay") ||
    lower.includes("issue") ||
    lower.includes("wrong") ||
    lower.includes("disappointed") ||
    lower.includes("photos late") ||
    lower.includes("still waiting")
  ) {
    return {
      category: "business",
      isBusiness: true,
      label: "complaint",
      confidence: 0.89,
      suggestedAction: "Route immediately to Osemene (Owner) for personal, prioritized response.",
      summary: "Client expressing concern or delay issue.",
      highlightAlert: "⚠️ Client Feedback / Attention Needed",
    };
  }

  // 6. Referrals
  if (
    lower.includes("referred") ||
    lower.includes("recommended") ||
    lower.includes("told me about you") ||
    lower.includes("friend gave me your number")
  ) {
    return {
      category: "business",
      isBusiness: true,
      label: "referral",
      confidence: 0.87,
      suggestedAction: "Note referral source and warmly welcome to LamSparks.",
      summary: "Client referred by existing client or collaborator.",
      highlightAlert: "🤝 Client Referral",
    };
  }

  // 7. Explicit Photography Studio & Booking Intent
  const studioKeywords = [
    "portrait",
    "portraits",
    "maternity",
    "editorial",
    "wedding",
    "photoshoot",
    "shoot",
    "pictures",
    "photo session",
    "family session",
    "newborn",
    "baby shoot",
    "birthday shoot",
    "studio",
    "outfit",
    "outfits",
    "makeup",
    "backdrop",
    "booking",
    "book",
    "availability",
    "slot",
    "slots",
    "gallery",
    "retouch",
    "retouching",
    "osemene",
    "abuja",
    "session",
    "deliverables",
  ];

  const hasStudioIntent = studioKeywords.some((kw) => lower.includes(kw));
  if (hasStudioIntent) {
    return {
      category: "business",
      isBusiness: true,
      label: "session_inquiry",
      confidence: 0.85,
      suggestedAction: "Review session specifics and guide through personal booking journey.",
      summary: "Photography session enquiry.",
      highlightAlert: "📸 Studio Inquiry",
    };
  }

  // 8. Personal Chit-Chat, Family & Friends Vocabulary
  const personalKeywords = [
    "mom",
    "dad",
    "babe",
    "sweetheart",
    "darling",
    "bro",
    "brother",
    "sis",
    "sister",
    "cousin",
    "aunty",
    "uncle",
    "dinner",
    "lunch",
    "food",
    "are you home",
    "pick up",
    "groceries",
    "where are you",
    "see you later",
    "call me",
    "call when you see this",
    "how was your day",
    "good night",
    "happy birthday bro",
    "gym",
    "church",
    "how far",
    "send me credit",
    "urgent 2k",
    "oya na",
  ];

  const isPersonal = personalKeywords.some((pk) => lower.includes(pk));
  if (isPersonal) {
    return {
      category: "personal",
      isBusiness: false,
      label: "personal",
      confidence: 0.92,
      suggestedAction: "Personal text from friend/family. Excluded from client workflow.",
      summary: "Non-business personal contact or family chat.",
      highlightAlert: "👤 Personal / Non-Studio",
    };
  }

  // 9. Short ambiguous greetings without studio context
  const wordCount = lower.split(/\s+/).length;
  if (wordCount <= 3 && (lower === "hey" || lower === "hello" || lower === "hi" || lower === "what's up" || lower === "good morning" || lower === "good afternoon")) {
    return {
      category: "personal",
      isBusiness: false,
      label: "personal",
      confidence: 0.7,
      suggestedAction: "Casual greeting with no studio booking context. Placed in personal review.",
      summary: "Casual greeting without booking context.",
      highlightAlert: "💬 Casual Greeting",
    };
  }

  // 10. Default General Inquiry
  return {
    category: "business",
    isBusiness: true,
    label: "session_inquiry",
    confidence: 0.75,
    suggestedAction: "Review session specifics and guide through personal booking journey.",
    summary: "General enquiry about photography sessions and availability.",
    highlightAlert: "📸 General Inquiry",
  };
}

/**
 * Multi-Model AI Consensus Classifier
 * Runs several independent frontier/flash AI models across a single message, gathers
 * their individual judgments, and computes a robust smart consensus.
 *
 * User specification: "incorporate actual AI models i.e. several running through a single message
 * to class it into any of business or personal and then make a conclusion smartly based on each of their responses."
 */
export const CLASSIFICATION_ENSEMBLE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
];

export async function classifyInboundMessageWithMultiAI(
  messageText: string
): Promise<TriageResult> {
  const cleanText = messageText.trim();
  if (!cleanText) {
    return triageInboundMessage("");
  }

  const prompt = `You are an expert message classifier for LamSparks Photography (a luxury studio in Abuja, Nigeria).
Classify this WhatsApp/Instagram message received on the studio line:
"${cleanText}"

Determine:
1. category:
   - "business" for studio client inquiries (portrait, maternity, wedding, editorial sessions, pricing/rates, shoot bookings, slot availability, rescheduling, bank transfer deposits/receipts, client complaints, referrals).
   - "personal" for friends, family, personal reminders, casual chit-chat (e.g. mom, brother, dinner, groceries, lunch, FIFA, hanging out, casual greetings without studio intent).
   - "automated" for bank OTPs, login verification codes, security alerts.
2. label: "session_inquiry" | "price_question" | "deposit_submission" | "rescheduling" | "complaint" | "referral" | "personal" | "spam"
3. isBusiness: true if business, false if personal or automated
4. confidence: number between 0 and 1
5. reasoning: 1 concise sentence explaining your conclusion

Respond ONLY in strict JSON:
{"category": "...", "label": "...", "isBusiness": true, "confidence": 0.95, "reasoning": "..."}`;

  const apiKey = getApiKey();
  const votes: ModelVote[] = [];

  // Query multiple actual Gemini models in parallel
  const calls = CLASSIFICATION_ENSEMBLE_MODELS.map(async (model) => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const category = (parsed.category || "business").toLowerCase() as MessageCategory;
      const isBusiness = parsed.isBusiness !== undefined ? !!parsed.isBusiness : category === "business";
      const label = (parsed.label || (isBusiness ? "session_inquiry" : "personal")) as MessageTriageLabel;
      const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.9;
      const reasoning = parsed.reasoning || "Classified by AI model.";

      return {
        model,
        category,
        label,
        isBusiness,
        confidence,
        reasoning,
      } as ModelVote;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(calls);
  for (const r of results) {
    if (r) votes.push(r);
  }

  // Graceful fallback to rule-based triage if network AI calls fail
  if (votes.length === 0) {
    return triageInboundMessage(cleanText);
  }

  // Synthesize Smart Consensus from all model votes
  let businessVotes = 0;
  let personalVotes = 0;
  let automatedVotes = 0;

  for (const v of votes) {
    if (v.category === "personal") personalVotes++;
    else if (v.category === "automated") automatedVotes++;
    else businessVotes++;
  }

  const majorityCategory: MessageCategory =
    personalVotes > businessVotes && personalVotes > automatedVotes
      ? "personal"
      : automatedVotes > businessVotes
      ? "automated"
      : "business";

  const isBusiness = majorityCategory === "business";
  const agreeingVotes = votes.filter((v) => v.category === majorityCategory);
  const totalAgreed = agreeingVotes.length;
  const agreementPct = Math.round((totalAgreed / votes.length) * 100);

  // Pick the winning label from agreeing models with highest confidence
  agreeingVotes.sort((a, b) => b.confidence - a.confidence);
  const winner = agreeingVotes[0] || votes[0];
  const avgConfidence =
    agreeingVotes.reduce((acc, v) => acc + v.confidence, 0) / agreeingVotes.length;

  // Derive suggested action and highlight alert
  let suggestedAction = winner.reasoning;
  let highlightAlert = isBusiness ? "📸 Studio Client Lead" : "👤 Personal Contact";

  if (winner.label === "deposit_submission") {
    suggestedAction = "Check deposit queue to inspect payment screenshot against Fidelity Bank statement (5601662438).";
    highlightAlert = "📸 Deposit / Payment Reported";
  } else if (winner.label === "price_question") {
    suggestedAction = "Direct client to two-step estimate builder or share catalog starting rates.";
    highlightAlert = "💰 Pricing Inquiry";
  } else if (winner.label === "rescheduling") {
    suggestedAction = "Check 48-hour policy window and studio calendar availability.";
    highlightAlert = "📅 Rescheduling Request";
  } else if (winner.label === "complaint") {
    suggestedAction = "Route immediately to Osemene (Owner) for personal, prioritized response.";
    highlightAlert = "⚠️ Client Attention Needed";
  } else if (winner.label === "referral") {
    suggestedAction = "Note referral source and warmly welcome to LamSparks.";
    highlightAlert = "🤝 Client Referral";
  } else if (!isBusiness) {
    suggestedAction = "Personal or non-studio text. Filtered from client queue to protect studio privacy.";
    highlightAlert = majorityCategory === "automated" ? "🤖 Automated Code / OTP" : "👤 Personal / Filtered";
  }

  const consensusSummary = `${totalAgreed}/${votes.length} models agreed (${agreementPct}% consensus): ${winner.reasoning}`;

  return {
    category: majorityCategory,
    isBusiness,
    label: winner.label,
    confidence: Number(avgConfidence.toFixed(2)),
    suggestedAction,
    summary: winner.reasoning,
    highlightAlert,
    aiConsensus: {
      totalModels: votes.length,
      agreeingModels: totalAgreed,
      agreementPercentage: agreementPct,
      consensusSummary,
      modelVotes: votes,
    },
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
