const baseUrl = process.env.AI_RADAR_BASE_URL || "http://localhost:3000";
const urls = (process.env.SEED_URLS || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

if (!urls.length) {
  console.error("Set SEED_URLS to a comma-separated list of AI update/tool URLs.");
  console.error("Example: SEED_URLS=https://example.com/update,https://example.com/tool npm run seed:radar");
  process.exit(1);
}

for (const url of urls) {
  const response = await fetch(`${baseUrl}/api/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      query:
        "Create a judge-ready AI Radar post with what changed, access situation, usefulness, setup steps, starter prompt, Launchpad next step, and free alternatives if access is limited.",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`Failed ${url}: ${response.status}`, data);
    continue;
  }

  console.log(`Seeded ${url}: ${data.items?.length ?? 0} post(s)`);
}
