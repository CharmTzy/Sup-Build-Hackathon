import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { loadDotEnvLocal, maskDatabaseUrl } from "./env-utils.mjs";

const { Pool } = pg;

function isLocalDatabaseUrl(databaseUrl) {
  try {
    const { hostname } = new URL(databaseUrl);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function normalizeImageUrl(url) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function imageUrlsFromResult(result) {
  const urls = [
    result?.image,
    ...(result?.extras?.imageLinks ?? []),
    ...(result?.imageLinks ?? []),
  ]
    .map(normalizeImageUrl)
    .filter(Boolean);

  return Array.from(new Set(urls)).slice(0, 4);
}

function mergeImages(existing = [], discovered = []) {
  return Array.from(new Set([...existing, ...discovered].map(normalizeImageUrl).filter(Boolean))).slice(0, 4);
}

async function createDb(databaseUrl) {
  if (isLocalDatabaseUrl(databaseUrl)) {
    if (process.env.ALLOW_LOCAL_DATABASE_URL !== "true") {
      throw new Error(
        "DATABASE_URL points to localhost. Set ALLOW_LOCAL_DATABASE_URL=true if you want to backfill local Postgres.",
      );
    }

    const pool = new Pool({ connectionString: databaseUrl });
    return {
      async query(sql, params = []) {
        const result = await pool.query(sql, params);
        return result.rows;
      },
      async end() {
        await pool.end();
      },
    };
  }

  const sql = neon(databaseUrl);
  return {
    query(sqlText, params = []) {
      return sql.query(sqlText, params);
    },
    async end() {},
  };
}

async function fetchExaImages(urls) {
  const response = await fetch("https://api.exa.ai/contents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.EXA_API_KEY,
    },
    body: JSON.stringify({
      urls,
      text: false,
      highlights: false,
      extras: {
        imageLinks: 4,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa contents failed with ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const byUrl = new Map();

  for (const [index, result] of (data.results ?? []).entries()) {
    const images = imageUrlsFromResult(result);
    for (const key of [urls[index], result.url, result.id]) {
      if (key) byUrl.set(key, images);
    }
  }

  return byUrl;
}

loadDotEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to backfill Radar images.");
  process.exit(1);
}

if (!process.env.EXA_API_KEY) {
  console.error("EXA_API_KEY is required to backfill Radar images.");
  process.exit(1);
}

const limit = Number(process.env.RADAR_IMAGE_BACKFILL_LIMIT || 200);
const batchSize = Number(process.env.RADAR_IMAGE_BACKFILL_BATCH_SIZE || 6);
const db = await createDb(process.env.DATABASE_URL);

console.log(`Backfilling Radar images with DATABASE_URL=${maskDatabaseUrl(process.env.DATABASE_URL)}`);

try {
  const rows = await db.query(
    `
    SELECT id, source_url, raw_post
    FROM radar_posts
    WHERE source_url IS NOT NULL
      AND (
        raw_post->>'coverImageUrl' IS NULL
        OR raw_post->'relatedImageUrls' IS NULL
        OR CASE
          WHEN jsonb_typeof(raw_post->'relatedImageUrls') = 'array'
          THEN jsonb_array_length(raw_post->'relatedImageUrls') = 0
          ELSE true
        END
      )
    ORDER BY updated_at DESC, created_at DESC
    LIMIT $1
  `,
    [limit],
  );

  let updated = 0;
  let discovered = 0;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const imagesByUrl = await fetchExaImages(batch.map((row) => row.source_url));

    for (const row of batch) {
      const rawPost = row.raw_post ?? {};
      const discoveredImages = imagesByUrl.get(row.source_url) ?? [];
      const images = mergeImages(rawPost.relatedImageUrls, discoveredImages);
      if (!images.length) continue;

      const coverImageUrl = normalizeImageUrl(rawPost.coverImageUrl) ?? images[0];
      const patch = {
        coverImageUrl,
        relatedImageUrls: mergeImages([coverImageUrl], images),
      };

      await db.query(
        `
        UPDATE radar_posts
        SET raw_post = raw_post || $2::jsonb,
            updated_at = NOW()
        WHERE id = $1
      `,
        [row.id, JSON.stringify(patch)],
      );

      updated += 1;
      discovered += discoveredImages.length;
    }

    console.log(`Checked ${Math.min(index + batch.length, rows.length)} of ${rows.length} posts`);
  }

  console.log(JSON.stringify({ checked: rows.length, updated, discoveredImages: discovered }, null, 2));
} finally {
  await db.end();
}
