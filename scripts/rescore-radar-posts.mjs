import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function getOutputText(data) {
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

function clampScore(value) {
  return Math.max(0, Math.min(10, Math.round(Number(value) || 0)));
}

async function scoreBatch(items) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
              tutorialGoal: item.tutorial?.goal,
              tutorialSteps: item.tutorial?.steps,
              miniProject: item.miniProject,
              sourceUrl: item.sourceUrl,
            })),
          }),
        },
      ],
      max_output_tokens: 2200,
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

  if (!response.ok) {
    throw new Error(`OpenAI score analysis failed with ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(getOutputText(data));
  return new Map((parsed.scores ?? []).map((score) => [score.id, score]));
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required.");

  const sql = neon(process.env.DATABASE_URL);
  await sql.query(`
    ALTER TABLE radar_posts
    ADD COLUMN IF NOT EXISTS hype_score NUMERIC,
    ADD COLUMN IF NOT EXISTS useful_score NUMERIC,
    ADD COLUMN IF NOT EXISTS student_relevance_score NUMERIC
  `);

  const rows = await sql.query(`
    SELECT id, title, tool_name, category, summary, long_explanation, why_it_matters, tags,
      difficulty, access, perks, limitations, tutorial, mini_project, source_url, raw_post
    FROM radar_posts
    ORDER BY updated_at DESC, created_at DESC
  `);

  let updated = 0;
  const batchSize = Number(process.env.OPENAI_SCORE_BATCH_SIZE || 8);

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize).map((row) => ({
      ...(row.raw_post ?? {}),
      id: row.id,
      title: row.title,
      toolName: row.tool_name,
      category: row.category,
      summary: row.summary,
      longExplanation: row.long_explanation,
      whyItMatters: row.why_it_matters,
      tags: row.tags ?? [],
      difficulty: row.difficulty,
      access: row.access ?? {},
      perks: row.perks ?? [],
      limitations: row.limitations ?? [],
      tutorial: row.tutorial ?? {},
      miniProject: row.mini_project ?? {},
      sourceUrl: row.source_url,
    }));
    const scores = await scoreBatch(batch);

    for (const item of batch) {
      const score = scores.get(item.id);
      if (!score) continue;

      const hypeScore = clampScore(score.hypeScore);
      const usefulScore = clampScore(score.usefulScore);
      const studentRelevanceScore = clampScore(score.studentRelevanceScore);
      await sql.query(
        `
        UPDATE radar_posts
        SET hype_score = $2,
            useful_score = $3,
            student_relevance_score = $4,
            raw_post = jsonb_set(
              jsonb_set(
                jsonb_set(raw_post, '{hypeScore}', to_jsonb($2::numeric), true),
                '{usefulScore}', to_jsonb($3::numeric), true
              ),
              '{studentRelevanceScore}', to_jsonb($4::numeric), true
            ),
            updated_at = NOW()
        WHERE id = $1
      `,
        [item.id, hypeScore, usefulScore, studentRelevanceScore],
      );
      updated += 1;
    }

    console.log(`Rescored ${Math.min(index + batch.length, rows.length)} of ${rows.length} posts`);
  }

  const summary = await sql.query(`
    SELECT useful_score, student_relevance_score, COUNT(*)::int AS count
    FROM radar_posts
    GROUP BY useful_score, student_relevance_score
    ORDER BY useful_score DESC, student_relevance_score DESC
  `);
  console.log(JSON.stringify({ updated, distribution: summary }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
