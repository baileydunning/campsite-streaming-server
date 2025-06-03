import http from "http";
import { campsitesController } from "./controllers/campsitesController.js";
import { seedDB } from "./db/lmdb.js";
import { getMetrics } from "./utils/getMetrics.js";

await seedDB();
console.log("[INFO] Database seeded.");

const server = http.createServer(async (req, res) => {
  try {
    const { pathname, searchParams } = new URL(
      req.url,
      `http://${req.headers.host}`
    );

    if (pathname === "/campsites" && req.method === "GET") {
      console.log(`[INFO] Received request for ${pathname}`);

      const beforeMetrics = await getMetrics();

      // Stream the campsites data
      campsitesController(req, res, searchParams);

      const afterMetrics = await getMetrics();

      console.log("[METRICS] Campsites Stream CPU/Memory:", {
        cpuBefore: beforeMetrics.cpuUsage,
        cpuAfter: afterMetrics.cpuUsage,
        memoryBefore: beforeMetrics.memory,
        memoryAfter: afterMetrics.memory,
      });

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

server.listen(3000, () => console.log("[INFO] Server listening on port 3000"));
