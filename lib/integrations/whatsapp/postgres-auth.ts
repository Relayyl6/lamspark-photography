import { neon } from "@neondatabase/serverless";
import {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from "@whiskeysockets/baileys";

export async function usePostgresAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearAuth: () => Promise<void>;
}> {
  const sql = neon(process.env.DATABASE_URL!);

  // Ensure auth session storage table exists in Neon Lakebase Postgres
  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_auth_session (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // 1. Load or initialize credentials
  const credsRow = await sql`
    SELECT data FROM whatsapp_auth_session WHERE id = 'creds' LIMIT 1
  `.catch(() => []);

  let creds: AuthenticationCreds;
  if (credsRow.length > 0 && credsRow[0].data) {
    try {
      creds = JSON.parse(JSON.stringify(credsRow[0].data), BufferJSON.reviver);
    } catch {
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
  }

  // 2. Save credentials method
  const saveCreds = async () => {
    try {
      const serialized = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
      await sql`
        INSERT INTO whatsapp_auth_session (id, data, updated_at)
        VALUES ('creds', ${JSON.stringify(serialized)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;
    } catch (err) {
      console.error("[PostgresAuthState] Failed to save creds:", err);
    }
  };

  // 3. Clear auth keys (Used when unlinking device)
  const clearAuth = async () => {
    try {
      await sql`DELETE FROM whatsapp_auth_session`;
      console.log("[PostgresAuthState] Cleared WhatsApp authentication session from Neon DB");
    } catch (err) {
      console.error("[PostgresAuthState] Failed to clear auth session:", err);
    }
  };

  // 4. Return full Baileys AuthenticationState adapter
  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(
          type: T,
          ids: string[]
        ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
          const data: { [id: string]: SignalDataTypeMap[T] } = {};
          if (!ids || ids.length === 0) return data;

          try {
            const keyIds = ids.map((id) => `${type}-${id}`);
            // Fetch batch of keys from Neon DB
            const rows = await sql`
              SELECT id, data FROM whatsapp_auth_session WHERE id = ANY(${keyIds})
            `;

            for (const row of rows) {
              const rawId = row.id.replace(`${type}-`, "");
              try {
                data[rawId] = JSON.parse(JSON.stringify(row.data), BufferJSON.reviver);
              } catch {
                data[rawId] = row.data;
              }
            }
          } catch (err) {
            console.error(`[PostgresAuthState] Error fetching keys for ${type}:`, err);
          }

          return data;
        },
        set: async (dataset: any) => {
          try {
            for (const category in dataset) {
              for (const id in dataset[category]) {
                const value = dataset[category][id];
                const keyId = `${category}-${id}`;

                if (value) {
                  const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
                  await sql`
                    INSERT INTO whatsapp_auth_session (id, data, updated_at)
                    VALUES (${keyId}, ${JSON.stringify(serialized)}::jsonb, NOW())
                    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
                  `;
                } else {
                  await sql`
                    DELETE FROM whatsapp_auth_session WHERE id = ${keyId}
                  `;
                }
              }
            }
          } catch (err) {
            console.error("[PostgresAuthState] Error saving keys batch:", err);
          }
        },
      },
    },
    saveCreds,
    clearAuth,
  };
}
