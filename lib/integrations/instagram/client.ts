import path from "path";
import fs from "fs";
import { neon } from "@neondatabase/serverless";
import { triageInboundMessage } from "@/lib/ai/service";

let IgApiClient: any;
try {
  const mod = require("instagram-private-api");
  IgApiClient = mod.IgApiClient;
} catch (err) {
  console.warn("[Instagram Private API Import Warning]", err);
}

export interface InstagramStatus {
  connected: boolean;
  username: string | null;
  userId?: string | null;
  lastSyncAt?: string | null;
  error?: string | null;
}

interface InstagramGlobal {
  client: any;
  status: InstagramStatus;
  isSyncing: boolean;
}

const g = globalThis as unknown as { __lamsparks_instagram?: InstagramGlobal };

if (!g.__lamsparks_instagram) {
  g.__lamsparks_instagram = {
    client: null,
    status: {
      connected: false,
      username: null,
      userId: null,
    },
    isSyncing: false,
  };
}

const SESSION_FILE = path.resolve(process.cwd(), "data", "ig_session.json");

function ensureDataDir() {
  const dir = path.dirname(SESSION_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getInstagramStatus(): InstagramStatus {
  // If not connected in memory but session file exists, attempt auto-restore
  if (!g.__lamsparks_instagram!.status.connected && fs.existsSync(SESSION_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
      if (data.username) {
        g.__lamsparks_instagram!.status.connected = true;
        g.__lamsparks_instagram!.status.username = data.username;
        g.__lamsparks_instagram!.status.userId = data.userId;
      }
    } catch {}
  }
  return g.__lamsparks_instagram!.status;
}

export async function loginInstagram(username: string, password?: string): Promise<InstagramStatus> {
  const stateRef = g.__lamsparks_instagram!;
  ensureDataDir();

  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(username);

    // If session file exists and no password given, restore session
    if (fs.existsSync(SESSION_FILE) && !password) {
      try {
        const saved = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
        if (saved.cookies) {
          await ig.state.deserializeCookieJar(JSON.stringify(saved.cookies));
          stateRef.client = ig;
          stateRef.status = {
            connected: true,
            username: saved.username,
            userId: saved.userId,
            lastSyncAt: new Date().toISOString(),
          };
          return stateRef.status;
        }
      } catch (e) {
        console.warn("[IG session restore fallback]", e);
      }
    }

    if (!password) {
      throw new Error("Password is required for first-time Instagram login.");
    }

    // Perform live login
    await ig.simulate.preLoginFlow();
    const authUser = await ig.account.login(username, password);
    process.nextTick(async () => await ig.simulate.postLoginFlow());

    // Serialize cookies
    const cookies = await ig.state.serializeCookieJar();
    fs.writeFileSync(
      SESSION_FILE,
      JSON.stringify({
        username,
        userId: authUser.pk,
        cookies,
        savedAt: new Date().toISOString(),
      }, null, 2)
    );

    stateRef.client = ig;
    stateRef.status = {
      connected: true,
      username,
      userId: String(authUser.pk),
      lastSyncAt: new Date().toISOString(),
    };

    // Trigger initial inbox sync
    syncInstagramInbox().catch(() => {});

    return stateRef.status;
  } catch (err: any) {
    console.error("[Instagram Direct Login Error]", err);
    stateRef.status.error = err.message;
    throw err;
  }
}

export async function syncInstagramInbox(): Promise<number> {
  const stateRef = g.__lamsparks_instagram!;
  if (!stateRef.client || stateRef.isSyncing) return 0;

  stateRef.isSyncing = true;
  let newMessagesCount = 0;

  try {
    const inboxFeed = stateRef.client.feed.directInbox();
    const threads = await inboxFeed.records();

    const sql = neon(process.env.DATABASE_URL!);

    for (const thread of threads) {
      const users = thread.users || [];
      const otherUser = users[0];
      if (!otherUser) continue;

      const igHandle = otherUser.username || `ig_user_${otherUser.pk}`;
      const senderName = otherUser.full_name || `@${igHandle}`;
      const threadId = thread.thread_id;

      // Inspect latest items in thread
      const items = thread.items || [];
      const latestItem = items[0];
      if (!latestItem || String(latestItem.user_id) === String(stateRef.status.userId)) {
        // Latest message is from studio, skip
        continue;
      }

      const bodyText = latestItem.text || "";
      if (!bodyText.trim()) continue;

      // Find or create client
      let client = await sql.query(
        `SELECT id FROM client WHERE instagram_handle = $1 OR whatsapp_e164 = $2 LIMIT 1`,
        [igHandle, `@${igHandle}`]
      );

      let clientId: string;
      if (client.length > 0) {
        clientId = client[0].id;
      } else {
        const newClient = await sql.query(
          `INSERT INTO client (
            id, name, whatsapp_e164, instagram_handle, source_first, messaging_consent, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, 'instagram_direct', true, NOW(), NOW()
          ) RETURNING id`,
          [senderName, `@${igHandle}`, igHandle]
        );
        clientId = newClient[0].id;
      }

      // Find or create conversation for this Instagram account
      const hostUsername = stateRef.status.username || null;
      let conv = await sql.query(
        `SELECT id FROM conversation WHERE client_id = $1 AND channel = 'instagram' AND (host_account = $2 OR host_account IS NULL) LIMIT 1`,
        [clientId, hostUsername]
      );

      let convId: string;
      if (conv.length > 0) {
        convId = conv[0].id;
        if (hostUsername) {
          await sql.query(`UPDATE conversation SET host_account = $1 WHERE id = $2 AND host_account IS NULL`, [hostUsername, convId]);
        }
      } else {
        const newConv = await sql.query(
          `INSERT INTO conversation (
            id, client_id, channel, state, host_account, last_inbound_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, 'instagram', 'bot', $2, NOW(), NOW(), NOW()
          ) RETURNING id`,
          [clientId, hostUsername]
        );
        convId = newConv[0].id;
      }

      // Check if message already exists
      const existingMsg = await sql.query(
        `SELECT id FROM message WHERE conversation_id = $1 AND body = $2 LIMIT 1`,
        [convId, bodyText.trim()]
      );

      if (existingMsg.length === 0) {
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

        await sql.query(
          `INSERT INTO message (
            id, conversation_id, direction, body, status, ai_label, ai_draft, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, 'inbound', $2, 'delivered', $3, $4, NOW(), NOW()
          )`,
          [convId, bodyText.trim(), label, draft]
        );

        await sql.query(
          `UPDATE conversation SET last_inbound_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [convId]
        );

        newMessagesCount++;
      }
    }

    stateRef.status.lastSyncAt = new Date().toISOString();
  } catch (syncErr) {
    console.warn("[Instagram Inbox Sync Warning]", syncErr);
  } finally {
    stateRef.isSyncing = false;
  }

  return newMessagesCount;
}

export async function sendInstagramMessage(recipientHandleOrUserId: string, text: string): Promise<boolean> {
  const stateRef = g.__lamsparks_instagram!;
  if (!stateRef.client || !stateRef.status.connected) {
    throw new Error("Instagram Direct is not connected. Please log in through Studio Settings.");
  }

  const cleanHandle = recipientHandleOrUserId.replace("@", "").trim();

  // Look up user ID by username if not a numeric ID
  let targetPk = cleanHandle;
  if (!/^\d+$/.test(cleanHandle)) {
    try {
      const user = await stateRef.client.user.searchExact(cleanHandle);
      targetPk = String(user.pk);
    } catch {
      throw new Error(`Could not find Instagram user with handle @${cleanHandle}`);
    }
  }

  const thread = stateRef.client.entity.directThread([targetPk]);
  await thread.broadcastText(text.trim());
  return true;
}

export async function logoutInstagram(): Promise<boolean> {
  const stateRef = g.__lamsparks_instagram!;
  stateRef.client = null;
  stateRef.status = {
    connected: false,
    username: null,
    userId: null,
  };

  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch {}

  return true;
}
