import http from "http";
import { createApp } from "./app";
import { env } from "./config/env.config";
import { initWebSocket } from "./websocket/wsServer";

export const startServer = () => {
  const app = createApp();
  const server = http.createServer(app);

  //initialize WebSocket server
  initWebSocket(server);

  server.listen(env.PORT, () => {
    console.log(` Server running on port ${env.PORT}`);
    console.log(`🌐 WebSocket available at ws://localhost:${env.PORT}`);
  });

  return server; // Needed for WebSocket setup
};
