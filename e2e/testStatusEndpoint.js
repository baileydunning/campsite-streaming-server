import http from "http";
import { handleResponse } from "./utils.js";

export function testStatusEndpoint() {
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/status",
      method: "GET",
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        handleResponse(
          data,
          "GET /status returns 200 and has correct shape",
          (parsed) => {
            if (res.statusCode !== 200) {
              throw new Error(`Expected status 200 but got ${res.statusCode}`);
            }
            if (parsed.status !== "ok") {
              throw new Error(
                `Expected status to be 'ok' but got ${parsed.status}`
              );
            }
            if (typeof parsed.uptime !== "number") {
              throw new Error(
                `Expected uptime to be a number but got ${typeof parsed.uptime}`
              );
            }

            if (
              !parsed.metrics ||
              typeof parsed.metrics !== "object" ||
              Array.isArray(parsed.metrics)
            ) {
              throw new Error(
                `Expected parsed.metrics to be an object but got ${typeof parsed.metrics}`
              );
            }

            if (typeof parsed.metrics.cpuUsage !== "string") {
              throw new Error(
                `Expected metrics.cpuUsage to be a string but got ${typeof parsed
                  .metrics.cpuUsage}`
              );
            }
            if (!/^\d+(\.\d+)?%$/.test(parsed.metrics.cpuUsage.trim())) {
              throw new Error(
                `Expected metrics.cpuUsage to match /^\d+(\\.\\d+)?%$/ but got ${parsed.metrics.cpuUsage}`
              );
            }

            const mem = parsed.metrics.memory;
            if (!mem || typeof mem !== "object" || Array.isArray(mem)) {
              throw new Error(
                `Expected metrics.memory to be an object but got ${typeof mem}`
              );
            }
            const keys = [
              "rss",
              "heapTotal",
              "heapUsed",
              "external",
              "heapUsagePercent",
            ];
            keys.forEach((k) => {
              if (typeof mem[k] !== "string") {
                throw new Error(
                  `Expected memory.${k} to be a string but got ${typeof mem[k]}`
                );
              }
            });
            // Check MB/percent format, allowing for optional whitespace
            ["rss", "heapTotal", "heapUsed", "external"].forEach((k) => {
              if (!/^\d+(\.\d+)?\s*MB$/.test(mem[k].trim())) {
                throw new Error(
                  `Expected memory.${k} to match /^\d+(\\.\\d+)?\\s*MB$/ but got ${mem[k]}`
                );
              }
            });
            if (!/^\d+(\.\d+)?%$/.test(mem.heapUsagePercent.trim())) {
              throw new Error(
                `Expected memory.heapUsagePercent to match /^\d+(\\.\\d+)?%$/ but got ${mem.heapUsagePercent}`
              );
            }
          }
        );
      });
    }
  );

  req.on("error", (err) => {
    console.error("Failed: /status request error");
    console.error(`  ${err.message}`);
  });

  req.end();
}
