import { getSession } from "@/lib/auth/session";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  return session;
}
