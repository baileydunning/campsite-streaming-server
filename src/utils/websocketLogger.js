import WebSocket, { WebSocketServer } from "ws";

// Call this once, after you create your HTTP server but before you listen()
export function initWebSocketLogging(server) {
  // Create a WS server that defers its upgrade handling
  const wss = new WebSocketServer({ noServer: true });

  // Preserve original console methods
  const origLog = console.log;
  const origInfo = console.info;
  const origWarn = console.warn;
  const origError = console.error;

  // Helper to broadcast a message to all connected clients
  function broadcast(msg) {
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  // Override console.log to also broadcast
  console.log = (...args) => {
    const text = args.join(" ");
    origLog.apply(console, args);
    broadcast(text);
  };

  // Override console.info to also broadcast
  console.info = (...args) => {
    const text = args.join(" ");
    origInfo.apply(console, args);
    broadcast(`[INFO] ${text}`);
  };

  // Override console.warn to also broadcast
  console.warn = (...args) => {
    const text = args.join(" ");
    origWarn.apply(console, args);
    broadcast(`[WARN] ${text}`);
  };

  // Override console.error to also broadcast
  console.error = (...args) => {
    const text = args.join(" ");
    origError.apply(console, args);
    broadcast(`[ERROR] ${text}`);
  };

  // Log and handle WebSocket upgrade requests
  server.on("upgrade", (req, socket, head) => {
    origLog(`[WS] Upgrade request for ${req.url}`);
    wss.handleUpgrade(req, socket, head, (ws) => {
      origLog(`[WS] Handshake successful for ${req.url}`);
      wss.emit("connection", ws, req);
    });
  });

  // Handle new WebSocket connections
  wss.on("connection", (ws, req) => {
    console.log(`Websocket client connected from ${req.socket.remoteAddress}`);

    // Log incoming messages from clients
    ws.on("message", (message) => {
      console.log(`Websocket message from client: ${message}`);
    });

    // Log socket errors
    ws.on("error", (err) =>
      console.error("Websocket client socket error", err)
    );

    // Log when a client disconnects
    ws.on("close", (code, reason) => {
      console.log(
        `Websocket client disconnected: code=${code}, reason=${reason}`
      );
    });
  });

  // Handle server-level errors
  wss.on("error", (err) => console.error("Websocket error", err));

  return wss;
}
