import { NextRequest, NextResponse } from "next/server";
import { getLaunchpadStatuses, setLaunchpadStatus } from "@/lib/db";
import type { ProjectStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function clientIdFrom(request: NextRequest, body?: { clientId?: string }) {
  return body?.clientId?.trim() || request.nextUrl.searchParams.get("clientId")?.trim() || "";
}

export async function GET(request: NextRequest) {
  const clientId = clientIdFrom(request);
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
  const clientId = clientIdFrom(request, body);
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
