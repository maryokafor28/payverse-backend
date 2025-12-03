// src/websocket/wsServer.ts
import { WebSocketServer as WSS, WebSocket } from "ws";
import http from "http";

let wss: WSS | null = null;

export function initWebSocket(server: http.Server) {
  if (wss) return wss;

  wss = new WSS({ server });

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected");

    ws.on("message", (message) => {
      console.log("📨 Received WS message:", message.toString());
    });

    ws.on("close", () => {
      console.log("🔌 WebSocket client disconnected");
    });
  });

  console.log("🌐 WebSocket server initialized");
  return wss;
}

export const WebSocketServer = {
  broadcast: (data: string) => {
    if (!wss) return;

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  },
};
