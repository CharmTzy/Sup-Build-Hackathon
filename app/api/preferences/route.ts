import { NextRequest, NextResponse } from "next/server";
import { getPreferences, savePreferences } from "@/lib/db";
import type { UserPreferences } from "@/lib/types";

export const dynamic = "force-dynamic";

function clientIdFrom(request: NextRequest, body?: { clientId?: string }) {
  return body?.clientId?.trim() || request.nextUrl.searchParams.get("clientId")?.trim() || "";
}

export async function GET(request: NextRequest) {
  const clientId = clientIdFrom(request);
  if (!clientId) {
    return NextResponse.json({ preferences: null, saved: false, message: "clientId is required." }, { status: 400 });
  }

  const preferences = await getPreferences(clientId);
  return NextResponse.json({
    preferences,
    saved: Boolean(preferences),
    message: preferences ? "Preferences loaded from database." : "No saved preferences yet.",
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    preferences?: UserPreferences;
  };
  const clientId = clientIdFrom(request, body);

  if (!clientId || !body.preferences) {
    return NextResponse.json({ saved: false, message: "clientId and preferences are required." }, { status: 400 });
  }

  const saved = await savePreferences(clientId, body.preferences);
  return NextResponse.json({
    saved,
    preferences: body.preferences,
    message: saved ? "Preferences saved." : "Database is not configured. Preferences saved locally only.",
  });
}
