import type { AIUpdate } from "@/lib/types";
import { clampScore } from "@/lib/radar-utils";

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

type ScoreResult = {
  id: string;
  hypeScore: number;
  usefulScore: number;
  studentRelevanceScore: number;
};

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function scoreJitter(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return (hash % 3) - 1;
}

function categoryBase(category: string, text: string) {
  const lower = `${category} ${text}`.toLowerCase();

  if (includesAny(lower, ["coding", "developer", "agent", "automation", "workflow"])) {
    return { useful: 8, student: 8 };
  }
  if (includesAny(lower, ["education", "student", "learn", "course", "tutorial"])) {
    return { useful: 8, student: 9 };
  }
  if (includesAny(lower, ["design", "ui", "ux", "image", "video", "creative"])) {
    return { useful: 7, student: 7 };
  }
  if (includesAny(lower, ["research", "paper", "benchmark"])) {
    return { useful: 7, student: 6 };
  }
  if (includesAny(lower, ["frontier", "model release", "preview", "launch"])) {
    return { useful: 6, student: 5 };
  }
  if (includesAny(lower, ["funding", "enterprise", "acquisition", "policy"])) {
    return { useful: 5, student: 4 };
  }

  return { useful: 6, student: 6 };
}

export function rescoreAIUpdate(item: AIUpdate): AIUpdate {
  const text = [
    item.title,
    item.toolName,
    item.category,
    item.summary,
    item.longExplanation,
    item.whyItMatters,
    item.tags.join(" "),
    item.bestFor.join(" "),
    item.perks.join(" "),
    item.limitations.join(" "),
    item.tutorial?.goal,
    item.tutorial?.expectedOutput,
    item.tutorial?.steps?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const base = categoryBase(item.category, text);
  let useful = base.useful;
  let student = base.student;

  if (item.sourceUrl) useful += 1;
  if (item.access.openSource || item.access.freeTier) {
    useful += 1;
    student += 2;
  }
  if (item.access.trialCredits === "Yes" || item.access.studentDiscount === "Yes") {
    useful += 1;
    student += 1;
  }
  if (item.access.apiAvailable) useful += 1;
  if (item.access.noCodeFriendly) student += 1;
  if (item.access.paidOnly) {
    useful -= 1;
    student -= 2;
  }
  if (item.access.waitlistRequired) {
    useful -= 2;
    student -= 2;
  }

  if (includesAny(text, ["setup", "step by step", "tutorial", "starter", "template", "example", "demo", "quickstart"])) {
    useful += 1;
    student += 1;
  }
  if (includesAny(text, ["portfolio", "assignment", "study", "class", "student", "beginner", "learn"])) student += 2;
  if (includesAny(text, ["open source", "free tier", "free plan", "local", "github"])) student += 1;
  if (includesAny(text, ["available now", "public beta", "released", "launched", "shipping"])) useful += 1;
  if (includesAny(text, ["limited preview", "invite only", "enterprise", "contact sales", "not yet available"])) {
    useful -= 1;
    student -= 2;
  }

  if (item.difficulty === "Beginner") student += 1;
  if (item.difficulty === "Advanced") student -= 1;

  const jitter = scoreJitter(`${item.id}:${item.title}`);
  useful += jitter;
  student -= jitter;

  return {
    ...item,
    usefulScore: clampScore(useful),
    studentRelevanceScore: clampScore(student),
  };
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

function scoreSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["scores"],
    properties: {
      scores: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "hypeScore", "usefulScore", "studentRelevanceScore"],
          properties: {
            id: { type: "string" },
            hypeScore: { type: "integer", minimum: 0, maximum: 10 },
            usefulScore: { type: "integer", minimum: 0, maximum: 10 },
            studentRelevanceScore: { type: "integer", minimum: 0, maximum: 10 },
          },
        },
      },
    },
  };
}

export async function scoreAIUpdatesWithOpenAI(items: AIUpdate[], signal?: AbortSignal) {
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey || !items.length) return items;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input: [
        {
          role: "system",
          content:
            "You are a strict AI Radar scoring judge. Score realistically, not generously. A 10 is rare and means exceptional current value. Use the full 0-10 range. Do not give every item the same score.",
        },
        {
          role: "user",
          content: JSON.stringify({
            rubric: {
              hypeScore:
                "Novelty, current attention, and how much builders are likely talking about it. News-only updates can score high here even if they are not practical yet.",
              usefulScore:
                "How actionable and valuable this is today for a builder. Lower the score for waitlists, vague announcements, enterprise-only access, missing setup path, or mostly informational posts.",
              studentRelevanceScore:
                "Fit for students and early builders. Reward free/open-source access, beginner-friendly setup, learning value, portfolio projects, and low prerequisites. Penalize paid-only, API-only, enterprise, waitlists, or advanced research without a practical path.",
            },
            scoringRules: [
              "Most good items should land between 5 and 8.",
              "Use 9 only for unusually practical, accessible, timely items.",
              "Use 10 only when the item is exceptional on that metric.",
              "API setup should usually lower student fit unless the tutorial is beginner-friendly and free/cheap.",
              "Research or funding news may be interesting but should not automatically be highly useful.",
            ],
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              toolName: item.toolName,
              category: item.category,
              summary: item.summary,
              longExplanation: item.longExplanation,
              whyItMatters: item.whyItMatters,
              tags: item.tags,
              difficulty: item.difficulty,
              access: item.access,
              perks: item.perks,
              limitations: item.limitations,
              tutorialGoal: item.tutorial.goal,
              tutorialSteps: item.tutorial.steps,
              miniProject: item.miniProject,
              sourceUrl: item.sourceUrl,
            })),
          }),
        },
      ],
      max_output_tokens: 1800,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "ai_radar_scores",
          strict: true,
          schema: scoreSchema(),
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`OpenAI score analysis failed with ${response.status}`);

  const data = (await response.json()) as OpenAIResponse;
  if (data.error?.message) throw new Error(data.error.message);

  const parsed = JSON.parse(getOutputText(data)) as { scores?: ScoreResult[] };
  const scoreMap = new Map((parsed.scores ?? []).map((score) => [score.id, score]));

  return items.map((item) => {
    const score = scoreMap.get(item.id);
    if (!score) return item;

    return {
      ...item,
      hypeScore: clampScore(score.hypeScore),
      usefulScore: clampScore(score.usefulScore),
      studentRelevanceScore: clampScore(score.studentRelevanceScore),
    };
  });
}
