import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function resolveSessionClientId(request: NextRequest) {
  const user = await getSessionUser(request);
  return user?.clientId || "";
}

export async function resolveClientId(request: NextRequest, body?: { clientId?: string }) {
  const user = await getSessionUser(request);
  return user?.clientId || body?.clientId?.trim() || request.nextUrl.searchParams.get("clientId")?.trim() || "";
}
