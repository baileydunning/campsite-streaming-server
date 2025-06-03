import http from "http";
import { PassThrough } from "stream";
import { handleResponse } from "./utils.js";

export function simulateSlowClient() {
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/campsites",
      method: "GET",
    },
    (res) => {
      const throttle = new PassThrough({ highWaterMark: 1 });
      res.pipe(throttle);

      res.on("pause", () => {
        console.log("[CLIENT] upstream paused because throttle is full");
      });

      res.on("resume", () => {
        console.log("[CLIENT] upstream resumed because throttle drained");
      });

      throttle.on("drain", () => {
        console.log("[CLIENT] PassThrough buffer emptied → drain fired");
      });

      let buffer = "";
      throttle.on("data", (chunk) => {
        buffer += chunk.toString();
        throttle.pause();
        setTimeout(() => {
          console.log(
            `Received ${chunk.length} bytes (after artificial pause)`
          );
          throttle.resume();
        }, 500);
      });

      throttle.on("end", () => {
        handleResponse(
          buffer,
          "Simulated slow client receives full JSON array",
          (data) => {
            if (!Array.isArray(data)) {
              throw new Error("Response is not an array");
            }
            if (data.length === 0) {
              throw new Error("No campsites returned");
            }
          }
        );
      });
    }
  );

  req.on("error", (err) => {
    console.error("Failed: Slow client request error");
    console.error(`  ${err.message}`);
  });

  req.end();
}