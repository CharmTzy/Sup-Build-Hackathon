import { NextRequest, NextResponse } from "next/server";
import { recordPromptCopy } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    postId?: string;
    promptType?: string;
  };

  if (!body.clientId?.trim()) {
    return NextResponse.json({ saved: false, message: "clientId is required." }, { status: 400 });
  }

  const saved = await recordPromptCopy(body.clientId.trim(), body.postId?.trim(), body.promptType?.trim() || "starter");
  return NextResponse.json({
    saved,
    message: saved ? "Prompt copy event saved." : "Database is not configured.",
  });
}
