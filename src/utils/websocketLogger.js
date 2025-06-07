import WebSocket, { WebSocketServer } from "ws";

export function initWebSocketLogging(server) {
  const wss = new WebSocketServer({ noServer: true });

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

  console.log = (...args) => {
    const text = args.join(" ");
    origLog.apply(console, args);
    broadcast(text);
  };

  console.info = (...args) => {
    const text = args.join(" ");
    origInfo.apply(console, args);
    broadcast(`[INFO] ${text}`);
  };

  console.warn = (...args) => {
    const text = args.join(" ");
    origWarn.apply(console, args);
    broadcast(`[WARN] ${text}`);
  };

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

  wss.on("connection", (ws, req) => {
    console.log(`Websocket client connected from ${req.socket.remoteAddress}`);

    ws.on("message", (message) => {
      console.log(`Websocket message from client: ${message}`);
    });

    ws.on("error", (err) =>
      console.error("Websocket client socket error", err)
    );

    ws.on("close", (code, reason) => {
      console.log(
        `Websocket client disconnected: code=${code}, reason=${reason}`
      );
    });
  });

  wss.on("error", (err) => console.error("Websocket error", err));

  return wss;
}
