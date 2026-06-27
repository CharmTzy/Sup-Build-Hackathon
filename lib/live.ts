import type { AIUpdate, Difficulty, PortfolioValue } from "@/lib/types";
import { clampScore } from "@/lib/radar-utils";

export interface ExaResult {
  id?: string;
  title?: string;
  url?: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

type GeneratedLiveItem = Omit<
  AIUpdate,
  "id" | "date" | "sourceType" | "isSaved" | "isFeatured" | "sourceUrl"
>;

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}

const openAIModel = process.env.OPENAI_MODEL || "gpt-5.5";

export class LiveDataError extends Error {
  provider: "exa" | "openai";
  status: number;
  details?: string;

  constructor(provider: "exa" | "openai", action: string, status: number, details?: string) {
    super(`${provider} ${action} failed with ${status}${details ? `: ${details}` : ""}`);
    this.name = "LiveDataError";
    this.provider = provider;
    this.status = status;
    this.details = details;
  }
}

async function responseErrorDetails(response: Response) {
  const text = await response.text().catch(() => "");
  return text.trim().slice(0, 240) || response.statusText;
}

function slugify(input: string, fallback: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);

  return slug || fallback;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function getOutputText(data: OpenAIResponse) {
  if (data.output_text) return data.output_text;

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((part) => part.type === "output_text" || part.text)
      .map((part) => part.text ?? "")
      .join("") ?? ""
  );
}

function liveItemSchema() {
  const stringArray = { type: "array", items: { type: "string" } };
  const requiredTopLevel = [
    "title",
    "toolName",
    "category",
    "summary",
    "longExplanation",
    "whyItMatters",
    "tags",
    "hypeScore",
    "usefulScore",
    "studentRelevanceScore",
    "difficulty",
    "bestFor",
    "access",
    "perks",
    "limitations",
    "tutorial",
    "promptPack",
    "miniProject",
  ];

  return {
    type: "object",
    additionalProperties: false,
    required: requiredTopLevel,
    properties: {
      title: { type: "string" },
      toolName: { type: "string" },
      category: { type: "string" },
      summary: { type: "string" },
      longExplanation: { type: "string" },
      whyItMatters: { type: "string" },
      tags: stringArray,
      hypeScore: { type: "number", minimum: 0, maximum: 10 },
      usefulScore: { type: "number", minimum: 0, maximum: 10 },
      studentRelevanceScore: { type: "number", minimum: 0, maximum: 10 },
      difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
      bestFor: stringArray,
      access: {
        type: "object",
        additionalProperties: false,
        required: [
          "freeTier",
          "studentDiscount",
          "openSource",
          "trialCredits",
          "apiAvailable",
          "noCodeFriendly",
          "waitlistRequired",
          "paidOnly",
        ],
        properties: {
          freeTier: { type: "boolean" },
          studentDiscount: { type: "string", enum: ["Yes", "No", "Unknown"] },
          openSource: { type: "boolean" },
          trialCredits: { type: "string", enum: ["Yes", "No", "Unknown"] },
          apiAvailable: { type: "boolean" },
          noCodeFriendly: { type: "boolean" },
          waitlistRequired: { type: "boolean" },
          paidOnly: { type: "boolean" },
        },
      },
      perks: stringArray,
      limitations: stringArray,
      tutorial: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "goal",
          "estimatedTime",
          "difficulty",
          "toolsNeeded",
          "steps",
          "prompt",
          "expectedOutput",
          "commonMistakes",
          "nextStep",
        ],
        properties: {
          title: { type: "string" },
          goal: { type: "string" },
          estimatedTime: { type: "string" },
          difficulty: { type: "string" },
          toolsNeeded: stringArray,
          steps: stringArray,
          prompt: { type: "string" },
          expectedOutput: { type: "string" },
          commonMistakes: stringArray,
          nextStep: { type: "string" },
        },
      },
      promptPack: {
        type: "object",
        additionalProperties: false,
        required: ["student", "coding", "marketing", "design", "research", "career"],
        properties: {
          student: { type: "string" },
          coding: { type: "string" },
          marketing: { type: "string" },
          design: { type: "string" },
          research: { type: "string" },
          career: { type: "string" },
        },
      },
      miniProject: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "difficulty",
          "estimatedTime",
          "toolsNeeded",
          "skillsLearned",
          "portfolioValue",
          "steps",
          "output",
        ],
        properties: {
          title: { type: "string" },
          difficulty: { type: "string" },
          estimatedTime: { type: "string" },
          toolsNeeded: stringArray,
          skillsLearned: stringArray,
          portfolioValue: { type: "string", enum: ["Low", "Medium", "High"] },
          steps: stringArray,
          output: { type: "string" },
        },
      },
    },
  };
}

export async function searchExa(query: string, numResults = 8) {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return null;

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": exaKey,
    },
    body: JSON.stringify({
      query,
      type: "auto",
      category: "news",
      numResults,
      startPublishedDate: daysAgo(10),
      moderation: true,
      contents: {
        highlights: true,
        summary: {
          query:
            "Summarize the practical AI update, tool, announcement, or research result for students and early builders.",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new LiveDataError("exa", "search", response.status, await responseErrorDetails(response));
  }

  const data = (await response.json()) as { results?: ExaResult[] };
  return (data.results ?? []).filter((result) => result.title || result.summary || result.text);
}

export async function crawlExaUrls(urls: string[]) {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey || !urls.length) return null;

  const response = await fetch("https://api.exa.ai/contents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": exaKey,
    },
    body: JSON.stringify({
      urls,
      text: true,
      highlights: true,
      summary: {
        query:
          "Summarize the practical AI product update, model release, research result, pricing change, or tutorial value for students and early builders.",
      },
    }),
  });

  if (!response.ok) {
    throw new LiveDataError("exa", "crawl", response.status, await responseErrorDetails(response));
  }

  const data = (await response.json()) as { results?: ExaResult[] };
  return (data.results ?? []).filter((result) => result.title || result.summary || result.text);
}

function compactExaResult(result: ExaResult, index: number) {
  return {
    index,
    title: result.title,
    url: result.url,
    publishedDate: result.publishedDate,
    author: result.author,
    summary: result.summary,
    highlights: (result.highlights ?? []).slice(0, 3),
    text: result.text?.slice(0, 900),
  };
}

export async function transformWithOpenAI(results: ExaResult[], query: string) {
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAIModel,
      input: [
        {
          role: "system",
          content:
            "You transform fresh AI news into practical learning posts for students and software engineers. Produce JSON only through the schema. Do not write hype-score style copy. Explain what happened, what is actually new, who can use it, what the user can try today, and how to set it up step by step. Use plain language for someone who has not opened the source link yet.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task:
              "Create AI Radar reading posts from these Exa search results. The post must be useful even if the user never opens the original link. Use longExplanation for 'what is the news' with concrete context. Use whyItMatters for practical student/software-engineer relevance. Use tutorial for a detailed setup or first-try guide. Include limitations, but do not make limitations the main content. Avoid invented pricing; use Unknown when unsure.",
            query,
            results: results.map(compactExaResult),
          }),
        },
      ],
      max_output_tokens: 5200,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "ai_radar_feed",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["items"],
            properties: {
              items: {
                type: "array",
                minItems: 1,
                maxItems: 6,
                items: liveItemSchema(),
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new LiveDataError(
      "openai",
      "transform",
      response.status,
      await responseErrorDetails(response),
    );
  }

  const data = (await response.json()) as OpenAIResponse;
  if (data.error?.message) throw new Error(data.error.message);

  const text = getOutputText(data);
  const parsed = JSON.parse(text) as { items?: GeneratedLiveItem[] };
  return parsed.items ?? null;
}

function normalizeGeneratedItem(item: GeneratedLiveItem, result: ExaResult | undefined, index: number): AIUpdate {
  const title = item.title || result?.title || `Live AI update ${index + 1}`;

  return {
    ...item,
    id: `live-${slugify(title, String(index))}`,
    date: result?.publishedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    hypeScore: clampScore(item.hypeScore),
    usefulScore: clampScore(item.usefulScore),
    studentRelevanceScore: clampScore(item.studentRelevanceScore),
    difficulty: (["Beginner", "Intermediate", "Advanced"].includes(item.difficulty)
      ? item.difficulty
      : "Beginner") as Difficulty,
    miniProject: {
      ...item.miniProject,
      portfolioValue: (["Low", "Medium", "High"].includes(item.miniProject.portfolioValue)
        ? item.miniProject.portfolioValue
        : "Medium") as PortfolioValue,
    },
    sourceType: "Live",
    isSaved: false,
    isFeatured: index === 0,
    sourceUrl: result?.url,
  };
}

export async function getLiveRadarUpdates(query?: string) {
  const searchQuery =
    query?.trim() ||
    "latest AI tools model releases research breakthroughs AI apps for students builders this week";
  const results = await searchExa(searchQuery, query ? 4 : 4);

  if (!results?.length) return null;

  const generated = await transformWithOpenAI(results, searchQuery);
  if (!generated?.length) return null;

  return generated.map((item, index) => normalizeGeneratedItem(item, results[index], index));
}

export async function getCrawledRadarUpdates(urls: string[], query?: string) {
  const results = await crawlExaUrls(urls);
  if (!results?.length) return null;

  const generated = await transformWithOpenAI(
    results,
    query?.trim() || "Create AI Radar cards from crawled source pages",
  );
  if (!generated?.length) return null;

  return generated.map((item, index) => normalizeGeneratedItem(item, results[index], index));
}

export async function askOpenAI(question: string, items: AIUpdate[]) {
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAIModel,
      input: [
        {
          role: "system",
          content:
            "You are Ask Radar, a concise AI learning guide. Answer with practical recommendations from the provided AI Radar items. Mention tutorials or mini projects when useful. Do not invent tools outside the dataset unless the user explicitly asks for a broader suggestion.",
        },
        {
          role: "user",
          content: JSON.stringify({
            question,
            items: items.slice(0, 14).map((item) => ({
              title: item.title,
              toolName: item.toolName,
              category: item.category,
              summary: item.summary,
              whyItMatters: item.whyItMatters,
              tags: item.tags,
              scores: {
                hype: item.hypeScore,
                useful: item.usefulScore,
                student: item.studentRelevanceScore,
              },
              tutorial: item.tutorial.title,
              miniProject: item.miniProject.title,
            })),
          }),
        },
      ],
      max_output_tokens: 700,
      text: {
        verbosity: "low",
      },
    }),
  });

  if (!response.ok) {
    throw new LiveDataError("openai", "answer", response.status, await responseErrorDetails(response));
  }

  const data = (await response.json()) as OpenAIResponse;
  return getOutputText(data).trim() || null;
}
