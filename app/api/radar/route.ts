import { NextRequest, NextResponse } from "next/server";
import { getCachedRadarItems, getRadarPosts, saveRadarItems } from "@/lib/db";
import { getLiveRadarUpdates } from "@/lib/live";
import { getMockUpdates } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

function refreshRadarInBackground(cacheKey: string) {
  if (!process.env.EXA_API_KEY || !process.env.OPENAI_API_KEY) return;

  getLiveRadarUpdates()
    .then(async (items) => {
      if (items?.length) await saveRadarItems(cacheKey, items);
    })
    .catch((error) => console.error("Background radar refresh failed:", error));
}

export async function GET(request: NextRequest) {
  const cacheKey = "daily-radar";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 8) || 8, 20);
  const offset = Math.max(Number(request.nextUrl.searchParams.get("offset") ?? 0) || 0, 0);

  try {
    const storedPosts = await getRadarPosts(limit, offset);

    if (storedPosts?.length) {
      if (offset === 0) refreshRadarInBackground(cacheKey);

      return NextResponse.json({
        items: storedPosts,
        source: "live",
        generatedAt: new Date().toISOString(),
        message: "Radar posts loaded from database. Live refresh runs in the background.",
        hasMore: storedPosts.length === limit,
      });
    }

    if (offset === 0) {
      const cached = await getCachedRadarItems(cacheKey);

      if (cached?.items.length) {
        refreshRadarInBackground(cacheKey);

        return NextResponse.json({
          items: cached.items.slice(0, limit),
          source: "live",
          generatedAt: cached.updatedAt,
          message: "Cached Radar posts loaded first. A live refresh is running in the background.",
          hasMore: cached.items.length > limit,
        });
      }

      refreshRadarInBackground(cacheKey);
    }
  } catch (error) {
    console.error("Live radar fallback:", error);
  }

  const fallbackItems = offset === 0 ? getMockUpdates().slice(0, limit) : [];
  return NextResponse.json({
    items: fallbackItems,
    source: "mock",
    generatedAt: new Date().toISOString(),
    message:
      offset === 0
        ? "Demo posts shown immediately. Live Exa + OpenAI refresh is running in the background."
        : "No more stored Radar posts yet.",
    hasMore: offset === 0 && getMockUpdates().length > limit,
  });
}
