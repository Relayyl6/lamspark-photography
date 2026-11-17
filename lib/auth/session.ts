import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "owner" | "full" | "limited";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
}

const SECRET = process.env.STUDIO_AUTH_SECRET;
const SALT = process.env.STUDIO_AUTH_SALT || "lamsparks_salt_production_env";
export const SESSION_COOKIE_NAME = "lamsparks_session";

function getSecret(): string {
  if (!SECRET) {
    throw new Error("STUDIO_AUTH_SECRET environment variable is missing.");
  }
  return SECRET;
}

export function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 64).toString("hex");
}

export function signToken(payload: SessionPayload): string {
  const secret = getSecret();
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const secret = getSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${data}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as SessionPayload;
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function authenticateStaff(email: string, passwordPlain: string): Promise<SessionPayload | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || user.length === 0) return null;
  const staff = user[0];
  if (!staff.active) return null;

  const inputHash = hashPassword(passwordPlain);
  if (inputHash !== staff.passwordHash) return null;

  const payload: SessionPayload = {
    userId: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role as UserRole,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };

  return payload;
}
