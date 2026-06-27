import { NextRequest, NextResponse } from "next/server";
import { getLaunchpadStatuses, setLaunchpadStatus } from "@/lib/db";
import { resolveClientId } from "@/lib/request-client";
import type { ProjectStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = await resolveClientId(request);
  if (!clientId) {
    return NextResponse.json({ statuses: {}, saved: false, message: "clientId is required." }, { status: 400 });
  }

  const statuses = await getLaunchpadStatuses(clientId);
  return NextResponse.json({
    statuses: statuses ?? {},
    saved: Boolean(statuses),
    message: statuses ? "Launchpad statuses loaded." : "Database is not configured. Using local Launchpad state.",
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    postId?: string;
    status?: ProjectStatus;
  };
  const clientId = await resolveClientId(request, body);
  const postId = body.postId?.trim() || "";

  if (!clientId || !postId || !body.status) {
    return NextResponse.json({ saved: false, message: "clientId, postId, and status are required." }, { status: 400 });
  }

  const saved = await setLaunchpadStatus(clientId, postId, body.status);
  return NextResponse.json({
    saved,
    status: body.status,
    message: saved ? "Launchpad status saved." : "Database is not configured. Status saved locally only.",
  });
}
