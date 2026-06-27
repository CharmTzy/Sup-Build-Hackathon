import { NextResponse } from "next/server";
import { getLiveRadarUpdates } from "@/lib/live";
import { getMockUpdates } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (process.env.EXA_API_KEY && process.env.OPENAI_API_KEY) {
      const liveItems = await getLiveRadarUpdates();

      if (liveItems?.length) {
        return NextResponse.json({
          items: liveItems,
          source: "live",
          generatedAt: new Date().toISOString(),
          message: "Live Exa news transformed by OpenAI.",
        });
      }
    }
  } catch (error) {
    console.error("Live radar fallback:", error);
  }

  return NextResponse.json({
    items: getMockUpdates(),
    source: "mock",
    generatedAt: new Date().toISOString(),
    message: "Demo fallback dataset. Add EXA_API_KEY and OPENAI_API_KEY for live AI Radar.",
  });
}
