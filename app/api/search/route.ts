import { NextRequest, NextResponse } from "next/server";
import { getLiveRadarUpdates } from "@/lib/live";
import { getMockUpdates } from "@/lib/mock-data";
import { searchItems } from "@/lib/radar-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({
      items: getMockUpdates(),
      source: "mock",
      generatedAt: new Date().toISOString(),
      message: "Type a query to search AI Radar.",
    });
  }

  try {
    if (process.env.EXA_API_KEY && process.env.OPENAI_API_KEY) {
      const liveItems = await getLiveRadarUpdates(`AI tools updates tutorials perks for ${query}`);

      if (liveItems?.length) {
        return NextResponse.json({
          items: liveItems,
          source: "live",
          generatedAt: new Date().toISOString(),
          message: "Live Exa semantic search transformed by OpenAI.",
        });
      }
    }
  } catch (error) {
    console.error("Live search fallback:", error);
  }

  return NextResponse.json({
    items: searchItems(getMockUpdates(), query),
    source: "mock",
    generatedAt: new Date().toISOString(),
    message: "Local fallback search. Add EXA_API_KEY and OPENAI_API_KEY for live semantic search.",
  });
}
