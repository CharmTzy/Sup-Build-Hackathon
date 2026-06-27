import { NextRequest, NextResponse } from "next/server";
import { saveGeneratedExport } from "@/lib/db";
import { resolveClientId } from "@/lib/request-client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    postId?: string;
    exportType?: string;
    content?: string;
  };
  const clientId = await resolveClientId(request, body);

  if (!clientId || !body.exportType?.trim() || !body.content) {
    return NextResponse.json(
      { saved: false, message: "clientId, exportType, and content are required." },
      { status: 400 },
    );
  }

  const saved = await saveGeneratedExport(
    clientId,
    body.postId?.trim(),
    body.exportType.trim(),
    body.content,
  );
  return NextResponse.json({
    saved,
    message: saved ? "Export saved." : "Database is not configured.",
  });
}
