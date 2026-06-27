import { NextRequest, NextResponse } from "next/server";
import { deleteSavedItemForClient, getSavedItems, saveItemForClient } from "@/lib/db";
import { resolveClientId } from "@/lib/request-client";
import type { AIUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = await resolveClientId(request);
  if (!clientId) {
    return NextResponse.json({ items: [], source: "live", message: "clientId is required." }, { status: 400 });
  }

  const items = await getSavedItems(clientId);
  return NextResponse.json({
    items: items ?? [],
    source: "live",
    message: items ? "Saved items loaded from database." : "Database is not configured. Using local saved items.",
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    item?: AIUpdate;
  };
  const clientId = await resolveClientId(request, body);

  if (!clientId || !body.item?.id) {
    return NextResponse.json({ saved: false, message: "clientId and item are required." }, { status: 400 });
  }

  const saved = await saveItemForClient(clientId, body.item);
  return NextResponse.json({
    saved,
    message: saved ? "Saved item stored in database." : "Database is not configured. Saved locally only.",
  });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    postId?: string;
  };
  const clientId = await resolveClientId(request, body);
  const postId = body.postId?.trim() || request.nextUrl.searchParams.get("postId")?.trim() || "";

  if (!clientId || !postId) {
    return NextResponse.json({ deleted: false, message: "clientId and postId are required." }, { status: 400 });
  }

  const deleted = await deleteSavedItemForClient(clientId, postId);
  return NextResponse.json({
    deleted,
    message: deleted ? "Saved item removed from database." : "Database is not configured.",
  });
}
