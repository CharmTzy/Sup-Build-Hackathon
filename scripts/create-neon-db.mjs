import { loadDotEnvLocal, maskDatabaseUrl, upsertDotEnvLocal } from "./env-utils.mjs";

const apiBase = "https://console.neon.tech/api/v2";

loadDotEnvLocal();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
  return value;
}

function buildCreateProjectBody() {
  const project = {
    name: process.env.NEON_PROJECT_NAME || "ai-radar",
    pg_version: Number(process.env.NEON_PG_VERSION || 17),
    branch: {
      name: process.env.NEON_BRANCH_NAME || "main",
      database_name: process.env.NEON_DATABASE_NAME || "ai_radar",
      role_name: process.env.NEON_ROLE_NAME || "ai_radar_owner",
    },
  };

  if (process.env.NEON_REGION_ID) project.region_id = process.env.NEON_REGION_ID;
  if (process.env.NEON_ORG_ID) project.org_id = process.env.NEON_ORG_ID;

  return { project };
}

async function neonRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.NEON_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.message || data?.error || text || response.statusText;
    throw new Error(`Neon API ${response.status}: ${message}`);
  }

  return data;
}

async function waitForOperations(projectId, operations = []) {
  const operationIds = operations.map((operation) => operation.id).filter(Boolean);
  if (!operationIds.length) return;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const statuses = await Promise.all(
      operationIds.map(async (operationId) => {
        const data = await neonRequest(`/projects/${projectId}/operations/${operationId}`);
        return data.operation?.status;
      }),
    );

    if (statuses.every((status) => status === "finished")) return;
    if (statuses.some((status) => status === "failed" || status === "error")) {
      throw new Error(`A Neon operation failed: ${statuses.join(", ")}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Timed out waiting for Neon project operations to finish.");
}

function getConnectionUri(projectResponse) {
  const uri = projectResponse.connection_uris?.[0]?.connection_uri;
  if (!uri) {
    throw new Error("Neon did not return a connection URI. Check whether the project has exactly one role and database.");
  }

  const parsed = new URL(uri);
  if (!parsed.searchParams.has("sslmode")) parsed.searchParams.set("sslmode", "require");
  return parsed.toString();
}

const apiKey = requireEnv("NEON_API_KEY");
process.env.NEON_API_KEY = apiKey;

try {
  console.log("Creating Neon project...");
  const created = await neonRequest("/projects", {
    method: "POST",
    body: JSON.stringify(buildCreateProjectBody()),
  });

  await waitForOperations(created.project.id, created.operations || []);

  const databaseUrl = getConnectionUri(created);
  upsertDotEnvLocal({
    DATABASE_URL: databaseUrl,
    NEON_PROJECT_ID: created.project.id,
  });

  process.env.DATABASE_URL = databaseUrl;

  console.log(`Created Neon project: ${created.project.name} (${created.project.id})`);
  console.log(`Saved DATABASE_URL=${maskDatabaseUrl(databaseUrl)} to .env.local`);
  console.log("Initializing AI Radar schema...");

  await import("./init-db.mjs");
} catch (error) {
  console.error("Neon setup failed.");
  console.error(error);
  process.exit(1);
}
