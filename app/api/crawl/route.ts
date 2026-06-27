import { NextRequest, NextResponse } from "next/server";
import { getCrawledRadarUpdates } from "@/lib/live";

export const dynamic = "force-dynamic";

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

  const items = await getCrawledRadarUpdates(urls, body.query);

  return NextResponse.json({
    items: items ?? [],
    source: items?.length ? "live" : "mock",
    generatedAt: new Date().toISOString(),
    message: items?.length
      ? "Crawled source pages with Exa and transformed them with OpenAI."
      : "Exa crawl returned no usable source content.",
  });
}
