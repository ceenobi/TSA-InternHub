import fs from "node:fs";
import { Client } from "@upstash/qstash";

function loadEnv(path = ".env") {
  const env = {};
  if (!fs.existsSync(path)) return env;
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const token = env.QSTASH_TOKEN;
const clientUrl = (env.CLIENT_URL ?? "").replace(/\/+$/, "");
if (!token || !clientUrl) {
  console.error("Missing QSTASH_TOKEN or CLIENT_URL in .env");
  process.exit(1);
}

const destination = `${clientUrl}/api/v1/workflow/run-status-updates`;
const cron = "*/15 * * * *";

const client = new Client({ token });

const existing = await client.schedules.list();
const dup = existing.find((s) => s.destination === destination && s.cron === cron);
if (dup) {
  console.log(`Schedule already exists: ${dup.scheduleId} (${dup.cron})`);
  process.exit(0);
}

const created = await client.schedules.create({ destination, cron });
console.log(`Created schedule: ${created.scheduleId} (${cron}) -> ${destination}`);
