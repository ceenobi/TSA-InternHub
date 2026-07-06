import mongoose from "mongoose";
import { testRedisConnection } from "~/.server/config/redis";
import logger from "~/.server/config/logger";
import { env } from "~/.server/config/keys";
import type { Route } from "./+types/api.health";

const DB_STATE_LABELS: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export async function loader({}: Route.LoaderArgs) {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "ok" : "down";

  let redisStatus = "down";
  let redisPing: string | null = null;
  try {
    const pingResult = await Promise.race([
      testRedisConnection(),
      new Promise<false>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000),
      ),
    ]);
    if (pingResult) {
      redisStatus = "ok";
      redisPing = "PONG";
    }
  } catch (error) {
    logger.error(error, "Health check Redis ping failed");
  }

  const overall =
    dbStatus === "ok" && redisStatus === "ok"
      ? "ok"
      : dbStatus === "down" && redisStatus === "down"
        ? "down"
        : "degraded";

  const mem = process.memoryUsage();

  const body = {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env.nodeEnv,
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    checks: {
      database: { status: dbStatus, state: DB_STATE_LABELS[dbState] ?? "unknown" },
      redis: { status: redisStatus, ping: redisPing },
    },
  };

  const httpStatus = overall === "down" ? 503 : 200;

  return Response.json(body, { status: httpStatus });
}
