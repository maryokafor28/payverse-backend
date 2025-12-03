import { connectPostgres } from "./db/pgClients";
import { connectRedis } from "./cache/redisClient";
import { startServer } from "./server";

(async () => {
  try {
    console.log("Connecting to Postgres...");
    await connectPostgres();

    console.log("Connecting to Redis...");
    await connectRedis();

    console.log("Starting server...");
    startServer();
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
})();
