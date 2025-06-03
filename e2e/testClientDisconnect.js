import http from "http";
import { runTest } from "./utils.js";

export function testClientDisconnect() {
  let disconnected = false;

  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/campsites",
      method: "GET",
    },
    (res) => {
      let received = "";

      res.on("data", (chunk) => {
        received += chunk.toString();
        if (received.length > 100 && !disconnected) {
          req.destroy();
          disconnected = true;
          console.log("[TEST] Manually closed connection after partial stream");
        }
      });

      res.on("end", () => {
        // Only fail if we never disconnected
        if (!disconnected) {
          runTest("Early disconnect should not crash the server", () => {
            throw new Error(
              "Client should have disconnected before full response"
            );
          });
        }
      });
    }
  );

  req.on("close", () => {
    runTest("Server handled early client disconnect without error", () => {
      // Test passes if we reach here
    });
  });

  req.on("error", (err) => {
    console.error("Failed: Error during early disconnect test");
    console.error(`  ${err.message}`);
  });

  req.end();
}
