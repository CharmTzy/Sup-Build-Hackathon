import type { AIUpdate, ProjectStatus } from "@/lib/types";

export const filterChips = [
  "All",
  "Student",
  "Coding",
  "Design",
  "Business",
  "Free Tools",
  "Portfolio",
] as const;

export const popularSearches = [
  "Free AI tools",
  "AI for presentations",
  "AI for coding",
  "AI for design",
  "AI for business",
  "AI video tools",
  "Student discounts",
  "Prompt packs",
  "Portfolio projects",
  "This week in AI",
] as const;

export const accessLabels: Array<{
  key: keyof AIUpdate["access"];
  label: string;
  activeText: string;
  inactiveText: string;
}> = [
  { key: "freeTier", label: "Free tier", activeText: "Free tier", inactiveText: "No free tier" },
  {
    key: "studentDiscount",
    label: "Student discount",
    activeText: "Student discount",
    inactiveText: "Student discount unknown",
  },
  { key: "openSource", label: "Open source", activeText: "Open source", inactiveText: "Closed source" },
  {
    key: "trialCredits",
    label: "Trial credits",
    activeText: "Trial credits",
    inactiveText: "Trial unknown",
  },
  { key: "apiAvailable", label: "API", activeText: "API", inactiveText: "No public API" },
  {
    key: "noCodeFriendly",
    label: "No-code",
    activeText: "No-code friendly",
    inactiveText: "Needs setup",
  },
  { key: "waitlistRequired", label: "Waitlist", activeText: "Waitlist", inactiveText: "No waitlist" },
  { key: "paidOnly", label: "Paid only", activeText: "Paid only", inactiveText: "Not paid only" },
];

export function clampScore(value: number) {
  if (Number.isNaN(value)) return 5;
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function getHypeMessage(item: AIUpdate) {
  if (item.hypeScore >= 8 && item.usefulScore <= 6) {
    return "High hype, but limited practical use for most students right now.";
  }

  if (item.studentRelevanceScore >= 8) {
    return "Worth trying for your next project.";
  }

  if (item.usefulScore >= 8) {
    return "Quietly useful, even if it is not the loudest AI story today.";
  }

  return "Try it if the use case fits your current project.";
}

export function getAccessBadgeText(item: AIUpdate) {
  return accessLabels.map((entry) => {
    const value = item.access[entry.key];
    const active = value === true || value === "Yes";
    const unknown = value === "Unknown";
    return {
      ...entry,
      active,
      text: active ? entry.activeText : unknown ? `${entry.label}: unknown` : entry.inactiveText,
    };
  });
}

function searchableText(item: AIUpdate) {
  return [
    item.title,
    item.toolName,
    item.category,
    item.summary,
    item.longExplanation,
    item.whyItMatters,
    item.difficulty,
    item.bestFor.join(" "),
    item.tags.join(" "),
    item.perks.join(" "),
    item.limitations.join(" "),
    item.tutorial.title,
    item.tutorial.goal,
    item.tutorial.prompt,
    item.tutorial.toolsNeeded.join(" "),
    item.tutorial.steps.join(" "),
    Object.values(item.promptPack).join(" "),
    item.miniProject.title,
    item.miniProject.toolsNeeded.join(" "),
    item.miniProject.skillsLearned.join(" "),
    item.miniProject.output,
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesFilter(item: AIUpdate, filter: string) {
  const normalized = filter.toLowerCase();
  if (normalized === "all") return true;
  if (normalized === "free tools") {
    return (
      item.access.freeTier ||
      item.access.openSource ||
      item.tags.some((tag) => tag.toLowerCase().includes("free"))
    );
  }
  if (normalized === "portfolio") {
    return (
      item.miniProject.portfolioValue === "High" ||
      item.tags.some((tag) => tag.toLowerCase().includes("portfolio"))
    );
  }

  return searchableText(item).includes(normalized);
}

export function filterItems(items: AIUpdate[], filter: string) {
  return items.filter((item) => matchesFilter(item, filter));
}

export function searchItems(items: AIUpdate[], query: string) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) return items;

  return items
    .map((item) => {
      const text = searchableText(item);
      const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
      const titleBoost = terms.some((term) => item.title.toLowerCase().includes(term)) ? 2 : 0;
      return { item, score: score + titleBoost };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.item.studentRelevanceScore - a.item.studentRelevanceScore)
    .map(({ item }) => item);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function buildLinkedInPost(item: AIUpdate) {
  return `I turned today's AI update into proof of work.

Project: ${item.miniProject.title}
Tool focus: ${item.toolName}

What I built:
- ${item.miniProject.output}

Why it matters:
${item.whyItMatters}

Skills practiced:
${item.miniProject.skillsLearned.map((skill) => `- ${skill}`).join("\n")}

Next step:
${item.tutorial.nextStep}

#AI #BuildInPublic #StudentBuilders #Portfolio`;
}

export function buildGithubReadme(item: AIUpdate, status: ProjectStatus) {
  return `# ${item.miniProject.title}

Status: ${status}

## Why This Exists
${item.whyItMatters}

## Tools Used
${item.miniProject.toolsNeeded.map((tool) => `- ${tool}`).join("\n")}

## Build Steps
${item.miniProject.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Skills Practiced
${item.miniProject.skillsLearned.map((skill) => `- ${skill}`).join("\n")}

## Output
${item.miniProject.output}

## Reflection
This project turns an AI trend into a practical artifact instead of another saved article. The main tradeoff was balancing speed with verification, especially around ${item.limitations[0].toLowerCase()}.
`;
}

export function getProgressTotals(
  items: AIUpdate[],
  savedIds: string[],
  projectStatuses: Record<string, ProjectStatus>,
  promptsCopied: number,
) {
  const completedProjects = Object.values(projectStatuses).filter((status) => status === "Completed").length;
  const activeProjects = Object.values(projectStatuses).filter((status) => status === "In Progress").length;
  const tutorialsCompleted = savedIds.filter((id) => projectStatuses[id] === "Completed").length;

  return {
    completedProjects,
    activeProjects,
    tutorialsCompleted,
    promptsCopied,
    savedTools: savedIds.length,
    portfolioScore: Math.min(100, completedProjects * 28 + tutorialsCompleted * 16 + promptsCopied * 4),
    weeklyProgress: Math.min(100, savedIds.length * 10 + activeProjects * 20 + completedProjects * 30),
    totalItems: items.length,
  };
}
