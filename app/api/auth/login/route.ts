import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { getUserAccountByEmail, migrateClientDataToAccount, publicUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    clientId?: string;
  };
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  const account = email ? await getUserAccountByEmail(email) : null;

  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ user: null, message: "Email or password is incorrect." }, { status: 401 });
  }

  await migrateClientDataToAccount(body.clientId, account.clientId);
  const user = publicUser(account);
  const response = NextResponse.json({ user, message: "Logged in." });
  setSessionCookie(response, account.id);
  return response;
}
