import { NextRequest, NextResponse } from "next/server";
import { getPreferences, getRadarPosts, saveRadarItems } from "@/lib/db";
import { getLiveRadarUpdates } from "@/lib/live";

export const dynamic = "force-dynamic";

function refreshSearchInBackground(query: string, preferenceText: string) {
  if (!process.env.EXA_API_KEY || !process.env.OPENAI_API_KEY) return;

  getLiveRadarUpdates(`AI tools updates tutorials access info perks for ${query}. User preference: ${preferenceText}`)
    .then(async (items) => {
      if (items?.length) await saveRadarItems(`search:${query.toLowerCase()}`, items);
    })
    .catch((error) => console.error("Background search refresh failed:", error));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim() || "";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 12) || 12, 30);
  const offset = Math.max(Number(request.nextUrl.searchParams.get("offset") ?? 0) || 0, 0);
  const preferences = clientId ? await getPreferences(clientId) : null;

  if (!query) {
    return NextResponse.json({
      items: [],
      source: "live",
      generatedAt: new Date().toISOString(),
      message: "Type a query to search AI Radar.",
      hasMore: false,
    });
  }

  const preferenceText = preferences
    ? `${preferences.audience}; interests: ${preferences.interests.join(", ") || "general"}; access: ${preferences.access}; difficulty: ${preferences.difficulty}`
    : "general users";

  try {
    const stored = await getRadarPosts({ query, preferences: preferences ?? undefined, limit, offset });
    if (offset === 0) refreshSearchInBackground(query, preferenceText);

    if (stored?.length) {
      return NextResponse.json({
        items: stored,
        source: "live",
        generatedAt: new Date().toISOString(),
        message: "Search results loaded from stored Radar posts. Live crawl refresh runs in the background.",
        hasMore: stored.length === limit,
      });
    }
  } catch (error) {
    console.error("Search fallback:", error);
  }

  return NextResponse.json({
    items: [],
    source: "live",
    generatedAt: new Date().toISOString(),
    message: "No stored search results yet. Live crawl refresh is running in the background.",
    hasMore: false,
  });
}
