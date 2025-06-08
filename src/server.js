import http from "http";
import { initWebSocketLogging } from "./utils/websocketLogger.js";
import { campsitesController } from "./controllers/campsitesController.js";
import { seedDB } from "./db/lmdb.js";
import { getMetrics } from "./utils/getMetrics.js";

// Initialize database
await seedDB();
console.log("[INFO] Database seeded.");

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  try {
    // Add CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    ); // Allow certain methods
    res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Allow Content-Type header

    // Handle preflight requests (OPTIONS)
    if (req.method === "OPTIONS") {
      res.writeHead(204); // No content response for preflight
      res.end();
      return;
    }

    const { pathname, searchParams } = new URL(
      req.url,
      `http://${req.headers.host}`
    );

    if (pathname === "/campsites" && req.method === "GET") {
      console.log(
        `[INFO] Received request for ${pathname}${
          searchParams && searchParams.toString()
            ? `?${searchParams.toString()}`
            : ""
        }`
      );

      const beforeMetrics = await getMetrics();

      // Stream the campsites data
      campsitesController(req, res, searchParams);

      const afterMetrics = await getMetrics();
      
      console.log("[METRICS] Campsites Stream CPU/Memory: ");
      console.log(
          JSON.stringify({
            cpuBefore: beforeMetrics.cpuUsage,
            cpuAfter: afterMetrics.cpuUsage,
            memoryBefore: beforeMetrics.memory,
            memoryAfter: afterMetrics.memory,
          })
      );

      return;
    }

    if (pathname === "/status" && req.method === "GET") {
      console.log(`[INFO] Received request for ${pathname}`);
      const metrics = await getMetrics();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          uptime: process.uptime(),
          metrics: metrics,
        })
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  } catch (err) {
    console.error("[ERROR] Unhandled exception in request handler:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("500 Internal Server Error");
  }
});

initWebSocketLogging(server);

// Start the HTTP server
server.listen(3000, () => console.log("[INFO] Server listening on port 3000"));
