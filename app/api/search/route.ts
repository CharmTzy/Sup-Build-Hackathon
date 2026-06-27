import { NextRequest, NextResponse } from "next/server";
import { getPreferences, getRadarPosts, saveRadarItems } from "@/lib/db";
import { getLiveRadarUpdates } from "@/lib/live";

export const dynamic = "force-dynamic";

const DEFAULT_SEARCH_LIMIT = 24;
const MAX_SEARCH_LIMIT = 50;

function getSearchPaging(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit")?.trim().toLowerCase();
  const rawOffset = request.nextUrl.searchParams.get("offset");

  if (rawLimit === "all") {
    return {
      limit: null as number | null,
      offset: 0,
    };
  }

  const parsedLimit = Number(rawLimit ?? DEFAULT_SEARCH_LIMIT);
  const parsedOffset = Number(rawOffset ?? 0);

  return {
    limit: Math.min(Math.max(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_SEARCH_LIMIT, 1), MAX_SEARCH_LIMIT),
    offset: Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0),
  };
}

function refreshSearchInBackground(query: string, preferenceText: string) {
  if (!process.env.EXA_API_KEY || !query.trim()) return;

  getLiveRadarUpdates(`AI tools updates tutorials access info perks for ${query}. User preference: ${preferenceText}`)
    .then(async (items) => {
      if (items?.length) await saveRadarItems(`search:${query.toLowerCase()}`, items);
    })
    .catch((error) => console.error("Background search refresh failed:", error));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim() || "";
  const { limit, offset } = getSearchPaging(request);
  const preferences = clientId ? await getPreferences(clientId) : null;

  const preferenceText = preferences
    ? `${preferences.audience}; interests: ${preferences.interests.join(", ") || "general"}; access: ${preferences.access}; difficulty: ${preferences.difficulty}`
    : "general users";

  try {
    const stored = await getRadarPosts({
      query: query || undefined,
      limit,
      offset,
    });

    if (query.length >= 2 && offset === 0) refreshSearchInBackground(query, preferenceText);

    if (stored?.length) {
      const hasMore = typeof limit === "number" && stored.length === limit;

      return NextResponse.json({
        items: stored,
        source: "live",
        generatedAt: new Date().toISOString(),
        message: query
          ? hasMore
            ? "Showing stored matches while more live results load in the background."
            : "Showing all stored matches. Live Exa refresh runs in the background."
          : hasMore
            ? "Showing recent stored Radar posts while the full live archive loads."
            : "Showing all stored Radar posts and crawled sources.",
        hasMore,
      });
    }
  } catch (error) {
    console.error("Search fallback:", error);
  }

  return NextResponse.json({
    items: [],
    source: "live",
    generatedAt: new Date().toISOString(),
    message: query
      ? "No stored search results yet. Live Exa refresh is running in the background."
      : "No stored Radar posts yet. Crawl a source or refresh Radar to fill Search.",
    hasMore: false,
  });
}
