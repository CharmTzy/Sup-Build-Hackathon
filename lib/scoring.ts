import type { AIUpdate } from "@/lib/types";
import { clampScore } from "@/lib/radar-utils";

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
