import { NextRequest, NextResponse } from "next/server";
import { recordPromptCopy } from "@/lib/db";
import { resolveClientId } from "@/lib/request-client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    postId?: string;
    promptType?: string;
  };
  const clientId = await resolveClientId(request, body);

  if (!clientId) {
    return NextResponse.json({ saved: false, message: "clientId is required." }, { status: 400 });
  }

  const saved = await recordPromptCopy(clientId, body.postId?.trim(), body.promptType?.trim() || "starter");
  return NextResponse.json({
    saved,
    message: saved ? "Prompt copy event saved." : "Database is not configured.",
  });
}
