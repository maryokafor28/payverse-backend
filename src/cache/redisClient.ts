import { createClient } from "redis";
import { env } from "../config/env.config";

export const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  password: env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("🔥 Connected to Redis");
  } catch (error) {
    console.error("❌ Redis connection error:", error);
  }
};
