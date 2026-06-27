import fs from "node:fs";
import path from "node:path";

function parseDotEnvFile(envPath) {
  const values = {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

export function loadDotEnvLocal(cwd = process.cwd()) {
  const protectedKeys = new Set(Object.keys(process.env));
  const values = {};

  for (const filename of [".env", ".env.local"]) {
    const envPath = path.join(cwd, filename);
    if (!fs.existsSync(envPath)) continue;

    const fileValues = parseDotEnvFile(envPath);
    Object.assign(values, fileValues);

    for (const [key, value] of Object.entries(fileValues)) {
      if (!protectedKeys.has(key)) process.env[key] = value;
    }
  }

  return values;
}

export function upsertDotEnvLocal(updates, cwd = process.cwd()) {
  const envPath = path.join(cwd, ".env.local");
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8").split(/\r?\n/) : [];
  const pending = new Map(Object.entries(updates));

  const next = existing.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return line;

    const key = trimmed.slice(0, trimmed.indexOf("=")).trim();
    if (!pending.has(key)) return line;

    const value = pending.get(key);
    pending.delete(key);
    return `${key}=${value}`;
  });

  for (const [key, value] of pending) {
    next.push(`${key}=${value}`);
  }

  fs.writeFileSync(envPath, `${next.filter((line, index, lines) => line || index < lines.length - 1).join("\n")}\n`);
}

export function maskDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "****";
    if (parsed.username) parsed.username = parsed.username ? `${parsed.username}` : "";
    return parsed.toString();
  } catch {
    return "(invalid url)";
  }
}
