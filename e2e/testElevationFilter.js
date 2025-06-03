import http from "http";
import { handleResponse } from "./utils.js";

export function testFilterMinElevation() {
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/campsites?min_elevation=10000",
      method: "GET",
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        handleResponse(
          data,
          "GET /campsites?min_elevation=10000 returns only high elevation sites",
          (campsites) => {
            if (!Array.isArray(campsites))
              throw new Error("Response is not an array");
            if (campsites.length === 0)
              throw new Error("No campsites returned");
            for (const site of campsites) {
              if (site.elevation_ft < 10000) {
                throw new Error(`Campsite ${site.name} below 10000 ft`);
              }
            }
          }
        );
      });
    }
  );

  req.on("error", (err) => {
    console.error("Failed: Min elevation request error");
    console.error(`  ${err.message}`);
  });

  req.end();
}

export function testFilterMaxElevation() {
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/campsites?max_elevation=9000",
      method: "GET",
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        handleResponse(
          data,
          "GET /campsites?max_elevation=9000 returns only low elevation sites",
          (campsites) => {
            if (!Array.isArray(campsites))
              throw new Error("Response is not an array");
            if (campsites.length === 0)
              throw new Error("No campsites returned");
            for (const site of campsites) {
              if (site.elevation_ft > 9000) {
                throw new Error(`Campsite ${site.name} above 9000 ft`);
              }
            }
          }
        );
      });
    }
  );

  req.on("error", (err) => {
    console.error("Failed: Max elevation request error");
    console.error(`  ${err.message}`);
  });

  req.end();
}

export function testFilterElevationRange() {
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/campsites?min_elevation=9500&max_elevation=10500",
      method: "GET",
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        handleResponse(
          data,
          "GET /campsites with elevation range returns correct subset",
          (campsites) => {
            if (!Array.isArray(campsites))
              throw new Error("Response is not an array");
            if (campsites.length === 0)
              throw new Error("No campsites returned");
            for (const site of campsites) {
              if (site.elevation_ft < 9500 || site.elevation_ft > 10500) {
                throw new Error(`Campsite ${site.name} outside range`);
              }
            }
          }
        );
      });
    }
  );

  req.on("error", (err) => {
    console.error("Failed: Elevation range request error");
    console.error(`  ${err.message}`);
  });

  req.end();
}
