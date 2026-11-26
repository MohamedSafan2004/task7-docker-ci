import rateLimit from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import redisClinet from "../config/redis";

//rate limiter for login: 5 attempts per 15 minutes, counter stored in Redis

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Too many Login attempts, try again in 15 mintes" },
  standardHeaders: true,
  legacyHeaders: false,

  // if Redis is down, let the request pass instead of returning 500
  passOnStoreError: true,
  store: new RedisStore({
    prefix: "rl:login:",
    sendCommand: (...args: string[]) =>
      redisClinet.sendCommand<RedisReply>(args),
  }),
});
