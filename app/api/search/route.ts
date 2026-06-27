import { NextRequest, NextResponse } from "next/server";
import { getPreferences, getRadarPosts, saveRadarItems } from "@/lib/db";
import { getLiveRadarUpdates } from "@/lib/live";

export const dynamic = "force-dynamic";

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
  const preferences = clientId ? await getPreferences(clientId) : null;

  const preferenceText = preferences
    ? `${preferences.audience}; interests: ${preferences.interests.join(", ") || "general"}; access: ${preferences.access}; difficulty: ${preferences.difficulty}`
    : "general users";

  try {
    const stored = await getRadarPosts({
      query: query || undefined,
      preferences: preferences ?? undefined,
      limit: null,
    });

    if (query.length >= 2) refreshSearchInBackground(query, preferenceText);

    if (stored?.length) {
      return NextResponse.json({
        items: stored,
        source: "live",
        generatedAt: new Date().toISOString(),
        message: query
          ? "Search results loaded from all stored Radar posts. Live Exa refresh runs in the background."
          : "Showing all stored Radar posts and crawled sources.",
        hasMore: false,
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
