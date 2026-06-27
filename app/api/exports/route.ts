import { NextRequest, NextResponse } from "next/server";
import { saveGeneratedExport } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    postId?: string;
    exportType?: string;
    content?: string;
  };

  if (!body.clientId?.trim() || !body.exportType?.trim() || !body.content) {
    return NextResponse.json(
      { saved: false, message: "clientId, exportType, and content are required." },
      { status: 400 },
    );
  }

  const saved = await saveGeneratedExport(
    body.clientId.trim(),
    body.postId?.trim(),
    body.exportType.trim(),
    body.content,
  );
  return NextResponse.json({
    saved,
    message: saved ? "Export saved." : "Database is not configured.",
  });
}
