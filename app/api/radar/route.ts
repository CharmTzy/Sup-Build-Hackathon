import { NextResponse } from "next/server";
import { getCachedRadarItems, isDatabaseConfigured, saveRadarItems } from "@/lib/db";
import { getLiveRadarUpdates, LiveDataError } from "@/lib/live";
import { getMockUpdates } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Live radar timed out after ${ms / 1000}s`)), ms);
    }),
  ]);
}

export async function GET() {
  const cacheKey = "daily-radar";

  try {
    if (process.env.EXA_API_KEY && process.env.OPENAI_API_KEY) {
      const cached = await getCachedRadarItems(cacheKey);

      if (cached?.items.length) {
        return NextResponse.json({
          items: cached.items,
          source: "live",
          generatedAt: cached.updatedAt,
          message: "Live AI Radar served from Neon cache.",
        });
      }

      const liveItems = await withTimeout(getLiveRadarUpdates(), 18000);

      if (liveItems?.length) {
        await saveRadarItems(cacheKey, liveItems);

        return NextResponse.json({
          items: liveItems,
          source: "live",
          generatedAt: new Date().toISOString(),
          message: isDatabaseConfigured()
            ? "Live Exa news transformed by OpenAI and cached in Neon."
            : "Live Exa news transformed by OpenAI. Add DATABASE_URL to enable Neon cache.",
        });
      }
    }
  } catch (error) {
    console.error("Live radar fallback:", error);

    if (error instanceof LiveDataError) {
      return NextResponse.json({
        items: getMockUpdates(),
        source: "mock",
        generatedAt: new Date().toISOString(),
        message:
          error.provider === "exa" && error.status === 401
            ? "Exa authentication failed with 401. Check EXA_API_KEY, then restart the dev server."
            : `Live ${error.provider} request failed with ${error.status}. Using mock fallback.`,
        liveError: {
          provider: error.provider,
          status: error.status,
          details: error.details,
        },
      });
    }

    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json({
        items: getMockUpdates(),
        source: "mock",
        generatedAt: new Date().toISOString(),
        message:
          "Live Exa + OpenAI generation is taking too long. Showing demo data now; try Refresh Radar again.",
        liveError: {
          provider: "pipeline",
          status: 504,
          details: error.message,
        },
      });
    }
  }

  return NextResponse.json({
    items: getMockUpdates(),
    source: "mock",
    generatedAt: new Date().toISOString(),
    message: "Demo fallback dataset. Add EXA_API_KEY and OPENAI_API_KEY for live AI Radar.",
  });
}
