import { initializeDatabaseSchema } from "@/lib/db";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    await initializeDatabaseSchema();
  } catch (error) {
    console.error("Database schema initialization failed:", error);
  }
}
