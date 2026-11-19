import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import pino from "pino";
import { neon } from "@neondatabase/serverless";
import { triageInboundMessage } from "@/lib/ai/service";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";

export interface BaileysStatus {
  state: "disconnected" | "connecting" | "qr_ready" | "connected";
  qrCodeDataUrl: string | null;
  pairingCode: string | null;
  user: {
    id: string;
    name?: string;
    phone?: string;
  } | null;
  lastConnectedAt?: string;
  error?: string | null;
}

interface BaileysGlobal {
  sock: any;
  status: BaileysStatus;
  isInitializing: boolean;
}

const g = globalThis as unknown as { __lamsparks_baileys?: BaileysGlobal };

if (!g.__lamsparks_baileys) {
  g.__lamsparks_baileys = {
    sock: null,
    status: {
      state: "disconnected",
      qrCodeDataUrl: null,
      pairingCode: null,
      user: null,
    },
    isInitializing: false,
  };
}

const AUTH_DIR = path.resolve(process.cwd(), "data", "baileys_auth");

function ensureAuthDir() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

export function getWhatsAppStatus(): BaileysStatus {
  return g.__lamsparks_baileys!.status;
}

export async function initWhatsApp(options: { phoneNumber?: string } = {}): Promise<BaileysStatus> {
  const stateRef = g.__lamsparks_baileys!;

  if (stateRef.status.state === "connected" && stateRef.sock) {
    return stateRef.status;
  }

  if (stateRef.isInitializing) {
    return stateRef.status;
  }

  stateRef.isInitializing = true;
  stateRef.status.state = "connecting";
  stateRef.status.error = null;

  try {
    ensureAuthDir();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const logger = pino({ level: "silent" });

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ["LamSparks Studio OS", "Chrome", "1.0.0"],
      syncFullHistory: false,
    });

    stateRef.sock = sock;

    // Pairing code mode for phone number e.g. +234 906 498 2841
    if (options.phoneNumber && !state.creds.registered) {
      const cleanPhone = options.phoneNumber.replace(/[^0-9]/g, "");
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(cleanPhone);
          stateRef.status.pairingCode = code;
          stateRef.status.state = "qr_ready";
          console.log(`[Baileys Pairing Code generated]: ${code}`);
        } catch (pairErr: any) {
          console.error("[Baileys Pairing Code Error]:", pairErr);
          stateRef.status.error = pairErr.message;
        }
      }, 1000);
    }

    // Credentials update handler
    sock.ev.on("creds.update", saveCreds);

    // Connection update handler
    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: { dark: "#1E1A17", light: "#FAF8F5" },
          });
          stateRef.status.qrCodeDataUrl = qrDataUrl;
          stateRef.status.state = "qr_ready";
        } catch (qrErr) {
          console.error("[QR Code Generation Error]", qrErr);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason?.loggedOut;
        console.warn(`[Baileys Connection Closed] statusCode: ${statusCode}, loggedOut: ${loggedOut}`, lastDisconnect?.error);

        stateRef.sock = null;
        stateRef.isInitializing = false;

        if (loggedOut) {
          stateRef.status.state = "disconnected";
          stateRef.status.qrCodeDataUrl = null;
          stateRef.status.pairingCode = null;
          stateRef.status.user = null;
        } else if (state.creds.registered) {
          // Auto-reconnect only if device is already registered/linked
          stateRef.status.state = "connecting";
          setTimeout(() => initWhatsApp(), 5000);
        } else {
          // Device not linked yet: keep QR code so user can scan it
          if (stateRef.status.qrCodeDataUrl || stateRef.status.pairingCode) {
            stateRef.status.state = "qr_ready";
          } else {
            stateRef.status.state = "disconnected";
          }
        }
      } else if (connection === "open") {
        console.log("[Baileys Connected to WhatsApp Web successfully!]");
        stateRef.status.state = "connected";
        stateRef.status.qrCodeDataUrl = null;
        stateRef.status.pairingCode = null;
        stateRef.status.lastConnectedAt = new Date().toISOString();

        const userJid = sock.user?.id || "";
        const cleanUserPhone = userJid.split(":")[0] || userJid.split("@")[0];
        stateRef.status.user = {
          id: userJid,
          name: sock.user?.name || "LamSparks Studio Line",
          phone: `+${cleanUserPhone}`,
        };
        stateRef.isInitializing = false;
      }
    });

    // Inbound Messages Upsert Handler
    sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
      if (type !== "notify") return;

      const sql = neon(process.env.DATABASE_URL!);

      for (const m of messages) {
        if (!m.message || m.key.fromMe) continue; // Ignore outbound or empty messages

        const remoteJid = m.key.remoteJid;
        if (!remoteJid || remoteJid.includes("@g.us")) continue; // Ignore groups for studio inbox

        const rawPhone = remoteJid.split("@")[0];
        const formattedPhone = `+${rawPhone}`;
        const senderName = m.pushName || formattedPhone;

        const bodyText =
          m.message?.conversation ||
          m.message?.extendedTextMessage?.text ||
          m.message?.imageMessage?.caption ||
          "";

        if (!bodyText.trim()) continue;

        try {
          // 1. Find or create client in Neon DB
          let client = await sql.query(
            `SELECT id, name, whatsapp_e164 FROM client WHERE whatsapp_e164 = $1 LIMIT 1`,
            [formattedPhone]
          );

          let clientId: string;
          if (client.length > 0) {
            clientId = client[0].id;
          } else {
            const newClient = await sql.query(
              `INSERT INTO client (
                id, name, whatsapp_e164, source_first, messaging_consent, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, 'whatsapp_baileys', true, NOW(), NOW()
              ) RETURNING id`,
              [senderName, formattedPhone]
            );
            clientId = newClient[0].id;
          }

          // 2. Find or create conversation
          let conv = await sql.query(
            `SELECT id, state FROM conversation WHERE client_id = $1 AND channel = 'whatsapp' LIMIT 1`,
            [clientId]
          );

          let convId: string;
          if (conv.length > 0) {
            convId = conv[0].id;
          } else {
            const newConv = await sql.query(
              `INSERT INTO conversation (
                id, client_id, channel, state, last_inbound_at, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, 'whatsapp', 'bot', NOW(), NOW(), NOW()
              ) RETURNING id`,
              [clientId]
            );
            convId = newConv[0].id;
          }

          // 3. AI Triage
          let label = "session_inquiry";
          let draft = "";
          try {
            const triage = triageInboundMessage(bodyText.trim());
            if (triage) {
              label = triage.label;
              draft = triage.suggestedAction || "";
            }
          } catch {
            label = "session_inquiry";
          }

          // 4. Insert message
          await sql.query(
            `INSERT INTO message (
              id, conversation_id, direction, body, status, ai_label, ai_draft, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, 'inbound', $2, 'delivered', $3, $4, NOW(), NOW()
            )`,
            [convId, bodyText.trim(), label, draft]
          );

          // 5. Update conversation timestamp
          await sql.query(
            `UPDATE conversation SET last_inbound_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [convId]
          );

          console.log(`[Baileys Live Inbound Saved]: ${senderName} (${formattedPhone}): "${bodyText.slice(0, 40)}..."`);
        } catch (dbErr) {
          console.error("[Baileys Inbound DB Ingest Error]", dbErr);
        }
      }
    });

    stateRef.isInitializing = false;
    return stateRef.status;
  } catch (err: any) {
    stateRef.isInitializing = false;
    stateRef.status.state = "disconnected";
    stateRef.status.error = err.message;
    console.error("[Baileys Initialization Error]", err);
    return stateRef.status;
  }
}

export async function sendWhatsAppMessage(recipientPhone: string, text: string): Promise<boolean> {
  const stateRef = g.__lamsparks_baileys!;

  if (!stateRef.sock || stateRef.status.state !== "connected") {
    throw new Error("WhatsApp Web is not currently connected. Please link your device via QR or Pairing Code.");
  }

  const cleanNumber = recipientPhone.replace(/[^0-9]/g, "");
  const jid = `${cleanNumber}@s.whatsapp.net`;

  await stateRef.sock.sendMessage(jid, { text: text.trim() });
  return true;
}

export async function disconnectWhatsApp(): Promise<boolean> {
  const stateRef = g.__lamsparks_baileys!;
  try {
    if (stateRef.sock) {
      await stateRef.sock.logout();
    }
  } catch {}

  stateRef.sock = null;
  stateRef.status = {
    state: "disconnected",
    qrCodeDataUrl: null,
    pairingCode: null,
    user: null,
  };

  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch {}

  return true;
}
