import { createClient } from "redis";

const redisClinet = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

redisClinet.on("error", (err) => {
  console.error("Redis error:", err.message);
});

// start connecting as soon as this file is imported, so anything that talks
// to Redis during startup (like the rate limiter store) waits in the queue
const connection = redisClinet.connect().then(() => {
  console.log("Redis connected");
});

// mark the rejection as handled so Node doesn't crash if Redis is down
// (index.ts still catches it when it awaits connectRedis)
connection.catch(() => {});

export function connectRedis(): Promise<void> {
  return connection;
}

export default redisClinet;
