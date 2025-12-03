import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required env vars
const required = [
  "PGHOST",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
  "REDIS_HOST",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  PORT: process.env.PORT || 4000,
  PGHOST: process.env.PGHOST!,
  PGPORT: Number(process.env.PGPORT) || 5432,
  PGUSER: process.env.PGUSER!,
  PGPASSWORD: process.env.PGPASSWORD!,
  PGDATABASE: process.env.PGDATABASE!,
  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
} as const;
