import { NextRequest, NextResponse } from "next/server";
import { getCachedRadarItems, getPreferences, getRadarPosts, saveRadarItems } from "@/lib/db";
import { getLiveRadarUpdates } from "@/lib/live";
import type { UserPreferences } from "@/lib/types";

export const dynamic = "force-dynamic";

function preferencePrompt(preferences: UserPreferences | null) {
  if (!preferences) return "general AI users";
  return `${preferences.audience}; interests: ${preferences.interests.join(", ") || "general AI"}; preferred access: ${preferences.access}; difficulty: ${preferences.difficulty}`;
}

function refreshRadarInBackground(cacheKey: string, preferences: UserPreferences | null, query?: string) {
  if (!process.env.EXA_API_KEY || !process.env.OPENAI_API_KEY) return;

  getLiveRadarUpdates(
    query?.trim() ||
      `latest AI tools and updates worth trying. User preference: ${preferencePrompt(preferences)}. Include setup guides, access limits, starter prompts, and launchpad next steps.`,
  )
    .then(async (items) => {
      if (items?.length) await saveRadarItems(cacheKey, items);
    })
    .catch((error) => console.error("Background radar refresh failed:", error));
}

export async function GET(request: NextRequest) {
  const cacheKey = "daily-radar";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 8) || 8, 20);
  const offset = Math.max(Number(request.nextUrl.searchParams.get("offset") ?? 0) || 0, 0);
  const filter = request.nextUrl.searchParams.get("filter")?.trim() || "All";
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim() || "";
  const preferences = clientId ? await getPreferences(clientId) : null;

  try {
    const storedPosts = await getRadarPosts({ limit, offset, filter, query, preferences: preferences ?? undefined });

    if (storedPosts?.length) {
      if (offset === 0) refreshRadarInBackground(cacheKey, preferences, query);

      return NextResponse.json({
        items: storedPosts,
        source: "live",
        generatedAt: new Date().toISOString(),
        message: "Radar posts loaded from database. Live Exa + OpenAI refresh runs in the background.",
        hasMore: storedPosts.length === limit,
      });
    }

    if (offset === 0) {
      const cached = await getCachedRadarItems(cacheKey);

      if (cached?.items.length) {
        refreshRadarInBackground(cacheKey, preferences, query);

        return NextResponse.json({
          items: cached.items.slice(0, limit),
          source: "live",
          generatedAt: cached.updatedAt,
          message: "Cached Radar posts loaded first. A live Exa + OpenAI refresh is running in the background.",
          hasMore: cached.items.length > limit,
        });
      }

      refreshRadarInBackground(cacheKey, preferences, query);
    }
    if (offset > 0) refreshRadarInBackground(cacheKey, preferences, query);
  } catch (error) {
    console.error("Live radar fallback:", error);
  }

  return NextResponse.json({
    items: [],
    source: "live",
    generatedAt: new Date().toISOString(),
    message:
      offset === 0
        ? "No stored Radar posts yet. Live Exa + OpenAI refresh is running in the background."
        : "Retrieving more preference-matched Radar posts in the background.",
    hasMore: true,
  });
}
