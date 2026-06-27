import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ user: null, message: "Logged out." });
  clearSessionCookie(response);
  return response;
}
