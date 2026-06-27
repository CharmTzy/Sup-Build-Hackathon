import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  return NextResponse.json({
    user,
    message: user ? "Account session loaded." : "No active account session.",
  });
}
