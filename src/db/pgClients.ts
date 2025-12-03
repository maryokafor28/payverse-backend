import { Pool } from "pg";
import { env } from "../config/env.config";

let pool: Pool;

export const connectPostgres = async () => {
  try {
    pool = new Pool({
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
    });

    await pool.connect();
    console.log(" Connected to PostgreSQL");
  } catch (error) {
    console.error(" PostgreSQL connection error:", error);
    process.exit(1);
  }
};

export const db = () => {
  if (!pool) {
    throw new Error(
      "Postgres has not been initialized. Call connectPostgres() first."
    );
  }
  return pool;
};
