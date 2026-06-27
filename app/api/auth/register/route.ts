import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { createUserAccount, getUserAccountByEmail, migrateClientDataToAccount, publicUser } from "@/lib/db";

export const dynamic = "force-dynamic";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
    clientId?: string;
  };
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ user: null, message: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ user: null, message: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await getUserAccountByEmail(email);
  if (existing) {
    return NextResponse.json({ user: null, message: "An account already exists for this email." }, { status: 409 });
  }

  const account = await createUserAccount({
    id: randomUUID(),
    email,
    name: body.name,
    passwordHash: hashPassword(password),
  });
  if (!account) {
    return NextResponse.json({ user: null, message: "Database is not configured for accounts." }, { status: 503 });
  }

  await migrateClientDataToAccount(body.clientId, account.clientId);
  const user = publicUser(account);
  const response = NextResponse.json({ user, message: "Account created." });
  setSessionCookie(response, account.id);
  return response;
}
