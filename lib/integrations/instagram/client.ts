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

interface StoredIgSession {
  username: string;
  userId: string;
  cookies: unknown;
  savedAt?: string;
  lastSyncAt?: string | null;
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

const IG_SESSION_ROW_ID = "default";

async function getSqlAndEnsureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS instagram_auth_session (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  return sql;
}

async function loadSavedSession(): Promise<StoredIgSession | null> {
  try {
    const sql = await getSqlAndEnsureTable();
    const rows = await sql.query(
      `SELECT data FROM instagram_auth_session WHERE id = $1 LIMIT 1`,
      [IG_SESSION_ROW_ID]
    );
    if (rows.length > 0 && rows[0].data) {
      return rows[0].data as StoredIgSession;
    }
  } catch (err) {
    console.warn("[Instagram Postgres Session Load Warning]", err);
  }
  return null;
}

async function saveSessionToDb(session: StoredIgSession): Promise<void> {
  try {
    const sql = await getSqlAndEnsureTable();
    await sql.query(
      `INSERT INTO instagram_auth_session (id, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [IG_SESSION_ROW_ID, JSON.stringify(session)]
    );
  } catch (err) {
    console.error("[Instagram Postgres Session Save Error]", err);
  }
}

async function clearSessionFromDb(): Promise<void> {
  try {
    const sql = await getSqlAndEnsureTable();
    await sql.query(`DELETE FROM instagram_auth_session WHERE id = $1`, [IG_SESSION_ROW_ID]);
  } catch (err) {
    console.warn("[Instagram Postgres Session Clear Warning]", err);
  }
}

/**
 * Restores an authenticated IgApiClient from Neon Postgres when running on a
 * cold serverless instance (e.g. Vercel) so sync and outbound replies survive restarts.
 */
async function ensureInstagramClient(): Promise<any | null> {
  const stateRef = g.__lamsparks_instagram!;
  if (stateRef.client && stateRef.status.connected) {
    return stateRef.client;
  }

  if (!IgApiClient) return null;

  const saved = await loadSavedSession();
  if (!saved?.username || !saved?.cookies) {
    return null;
  }

  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(saved.username);
    const cookieString =
      typeof saved.cookies === "string" ? saved.cookies : JSON.stringify(saved.cookies);
    await ig.state.deserializeCookieJar(cookieString);

    stateRef.client = ig;
    stateRef.status = {
      connected: true,
      username: saved.username,
      userId: String(saved.userId || ""),
      lastSyncAt: saved.lastSyncAt || saved.savedAt || null,
      error: null,
    };
    return ig;
  } catch (err) {
    console.warn("[Instagram Postgres Cold-Restore Warning]", err);
    return null;
  }
}

export async function getInstagramStatus(): Promise<InstagramStatus> {
  const stateRef = g.__lamsparks_instagram!;
  if (!stateRef.status.connected) {
    await ensureInstagramClient();
  }
  return stateRef.status;
}

export async function loginInstagram(username: string, password?: string): Promise<InstagramStatus> {
  const stateRef = g.__lamsparks_instagram!;

  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(username);

    // If a session already exists in Neon DB and no password given, restore session
    if (!password) {
      const saved = await loadSavedSession();
      if (saved?.cookies) {
        try {
          const cookieString =
            typeof saved.cookies === "string" ? saved.cookies : JSON.stringify(saved.cookies);
          await ig.state.deserializeCookieJar(cookieString);
          stateRef.client = ig;
          stateRef.status = {
            connected: true,
            username: saved.username,
            userId: String(saved.userId || ""),
            lastSyncAt: new Date().toISOString(),
            error: null,
          };
          return stateRef.status;
        } catch (e) {
          console.warn("[IG session restore fallback]", e);
        }
      }
      throw new Error("Password is required for first-time Instagram login.");
    }

    // Perform live login
    await ig.simulate.preLoginFlow();
    const authUser = await ig.account.login(username, password);
    process.nextTick(async () => {
      try {
        await ig.simulate.postLoginFlow();
      } catch {}
    });

    // Serialize cookies & persist to Neon PostgreSQL (serverless-safe, survives deploys)
    const cookies = await ig.state.serializeCookieJar();
    const nowIso = new Date().toISOString();
    await saveSessionToDb({
      username,
      userId: String(authUser.pk),
      cookies,
      savedAt: nowIso,
      lastSyncAt: nowIso,
    });

    stateRef.client = ig;
    stateRef.status = {
      connected: true,
      username,
      userId: String(authUser.pk),
      lastSyncAt: nowIso,
      error: null,
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
  if (stateRef.isSyncing) return 0;

  const client = await ensureInstagramClient();
  if (!client) return 0;

  stateRef.isSyncing = true;
  let newMessagesCount = 0;

  try {
    const inboxFeed = client.feed.directInbox();
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

    const syncedAt = new Date().toISOString();
    stateRef.status.lastSyncAt = syncedAt;

    // Persist latest cookie jar & sync timestamp back to Neon Postgres
    if (stateRef.status.username) {
      const updatedCookies = await client.state.serializeCookieJar();
      await saveSessionToDb({
        username: stateRef.status.username,
        userId: String(stateRef.status.userId || ""),
        cookies: updatedCookies,
        lastSyncAt: syncedAt,
      });
    }
  } catch (syncErr) {
    console.warn("[Instagram Inbox Sync Warning]", syncErr);
  } finally {
    stateRef.isSyncing = false;
  }

  return newMessagesCount;
}

export async function sendInstagramMessage(recipientHandleOrUserId: string, text: string): Promise<boolean> {
  const client = await ensureInstagramClient();
  const stateRef = g.__lamsparks_instagram!;
  if (!client || !stateRef.status.connected) {
    throw new Error("Instagram Direct is not connected. Please log in through Studio Settings.");
  }

  const cleanHandle = recipientHandleOrUserId.replace("@", "").trim();

  // Look up user ID by username if not a numeric ID
  let targetPk = cleanHandle;
  if (!/^\d+$/.test(cleanHandle)) {
    try {
      const user = await client.user.searchExact(cleanHandle);
      targetPk = String(user.pk);
    } catch {
      throw new Error(`Could not find Instagram user with handle @${cleanHandle}`);
    }
  }

  const thread = client.entity.directThread([targetPk]);
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

  await clearSessionFromDb();

  return true;
}
