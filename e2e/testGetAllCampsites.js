import http from "http";
import { handleResponse } from "./utils.js";

export function testGetAllCampsites() {
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/campsites",
      method: "GET",
    },
    (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        handleResponse(
          data,
          "GET /campsites returns a JSON array",
          (campsites) => {
            if (!Array.isArray(campsites))
              throw new Error("Response is not an array");
            if (campsites.length === 0)
              throw new Error("No campsites returned");
          }
        );
      });
    }
  );

  req.on("error", (err) => {
    console.error("Failed: HTTP request error");
    console.error(`  ${err.message}`);
  });

  req.end();
}
