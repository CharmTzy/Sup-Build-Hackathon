import { NextResponse } from "next/server";
import { getDatabaseConfigurationStatus, getSchemaHealth, initializeDatabaseSchema } from "@/lib/db";
import { LiveDataError, searchExa } from "@/lib/live";

export const dynamic = "force-dynamic";

async function checkDatabase() {
  const status = getDatabaseConfigurationStatus();

  if (!status.configured) {
    return { configured: false, ok: false, message: status.message };
  }

  try {
    await initializeDatabaseSchema();
    const schema = await getSchemaHealth();
    return { configured: true, ok: true, message: "Database connected and schema is ready.", schema };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : "Database check failed.",
    };
  }
}

async function checkExa() {
  if (!process.env.EXA_API_KEY) {
    return { configured: false, ok: false, message: "EXA_API_KEY is not configured." };
  }

  try {
    const results = await searchExa("latest OpenAI news", 1);
    return {
      configured: true,
      ok: Boolean(results),
      message: `Exa returned ${results?.length ?? 0} result(s).`,
    };
  } catch (error) {
    if (error instanceof LiveDataError) {
      return {
        configured: true,
        ok: false,
        message:
          error.status === 401
            ? "Exa authentication failed. Check EXA_API_KEY and restart the dev server."
            : error.message,
        status: error.status,
        details: error.details,
      };
    }

    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : "Exa check failed.",
    };
  }
}

export async function GET() {
  const [database, exa] = await Promise.all([checkDatabase(), checkExa()]);

  return NextResponse.json({
    ok: database.ok && exa.ok && Boolean(process.env.OPENAI_API_KEY),
    database,
    exa,
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
      ok: Boolean(process.env.OPENAI_API_KEY),
      message: process.env.OPENAI_API_KEY
        ? "OPENAI_API_KEY is configured. Full validation happens during generation."
        : "OPENAI_API_KEY is not configured.",
    },
  });
}
