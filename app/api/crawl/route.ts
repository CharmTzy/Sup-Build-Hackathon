import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCachedRadarItems, saveRadarItems } from "@/lib/db";
import { getCrawledRadarUpdates } from "@/lib/live";

export const dynamic = "force-dynamic";

function crawlCacheKey(urls: string[]) {
  const hash = createHash("sha256").update(urls.sort().join("|")).digest("hex").slice(0, 24);
  return `crawl:${hash}`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    urls?: string[];
    url?: string;
    query?: string;
  };

  const urls = [...(body.urls ?? []), body.url]
    .filter((url): url is string => Boolean(url?.trim()))
    .map((url) => url.trim())
    .slice(0, 6);

  if (!urls.length) {
    return NextResponse.json(
      {
        items: [],
        source: "mock",
        message: "Send a url or urls array to crawl with Exa and transform with OpenAI.",
      },
      { status: 400 },
    );
  }

  if (!process.env.EXA_API_KEY || !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        items: [],
        source: "mock",
        message: "EXA_API_KEY and OPENAI_API_KEY are required for crawl.",
      },
      { status: 503 },
    );
  }

  const cacheKey = crawlCacheKey(urls);
  const cached = await getCachedRadarItems(cacheKey);

  if (cached?.items.length) {
    return NextResponse.json({
      items: cached.items,
      source: "live",
      generatedAt: cached.updatedAt,
      message: "Crawled Radar post served from database cache.",
    });
  }

  const items = await getCrawledRadarUpdates(urls, body.query);
  if (items?.length) {
    await saveRadarItems(cacheKey, items);
  }

  return NextResponse.json({
    items: items ?? [],
    source: items?.length ? "live" : "mock",
    generatedAt: new Date().toISOString(),
    message: items?.length
      ? "Crawled source pages with Exa and transformed them with OpenAI."
      : "Exa crawl returned no usable source content.",
  });
}
