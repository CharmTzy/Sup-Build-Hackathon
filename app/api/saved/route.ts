import { NextRequest, NextResponse } from "next/server";
import { deleteSavedItemForClient, getSavedItems, saveItemForClient } from "@/lib/db";
import { resolveSessionClientId } from "@/lib/request-client";
import type { AIUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = await resolveSessionClientId(request);
  if (!clientId) {
    return NextResponse.json({ items: [], source: "live", message: "Log in to view saved items." }, { status: 401 });
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
    item?: AIUpdate;
  };
  const clientId = await resolveSessionClientId(request);

  if (!clientId || !body.item?.id) {
    return NextResponse.json({ saved: false, message: "Log in to save items." }, { status: 401 });
  }

  const saved = await saveItemForClient(clientId, body.item);
  return NextResponse.json({
    saved,
    message: saved ? "Saved item stored in database." : "Database is not configured. Saved locally only.",
  });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    postId?: string;
  };
  const clientId = await resolveSessionClientId(request);
  const postId = body.postId?.trim() || request.nextUrl.searchParams.get("postId")?.trim() || "";

  if (!clientId || !postId) {
    return NextResponse.json({ deleted: false, message: "Log in to remove saved items." }, { status: 401 });
  }

  const deleted = await deleteSavedItemForClient(clientId, postId);
  return NextResponse.json({
    deleted,
    message: deleted ? "Saved item removed from database." : "Database is not configured.",
  });
}
