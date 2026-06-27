import { NextRequest, NextResponse } from "next/server";
import { askOpenAI } from "@/lib/live";
import { getMockUpdates } from "@/lib/mock-data";
import { searchItems } from "@/lib/radar-utils";
import type { AIUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

function fallbackAnswer(question: string, items: AIUpdate[]) {
  const matches = searchItems(items, question).slice(0, 3);
  const picks = matches.length ? matches : items.slice(0, 3);

  return [
    "Here is the practical Radar take:",
    ...picks.map(
      (item) =>
        `- ${item.toolName}: ${item.summary} Try "${item.tutorial.title}" or build "${item.miniProject.title}".`,
    ),
    "Pick the option with the highest student relevance if you need a fast portfolio win.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    question?: string;
    items?: AIUpdate[];
  };

  const question = body.question?.trim() || "What should I try today?";
  const items = body.items?.length ? body.items : getMockUpdates();

  try {
    if (process.env.OPENAI_API_KEY) {
      const answer = await askOpenAI(question, items);

      if (answer) {
        return NextResponse.json({
          answer,
          source: "live",
        });
      }
    }
  } catch (error) {
    console.error("Ask Radar fallback:", error);
  }

  return NextResponse.json({
    answer: fallbackAnswer(question, items),
    source: "mock",
  });
}
