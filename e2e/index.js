import { testGetAllCampsites } from "./testGetAllCampsites.js";
import {
  testFilterMinElevation,
  testFilterMaxElevation,
  testFilterElevationRange,
} from "./testElevationFilter.js";
import { testStatusEndpoint } from "./testStatusEndpoint.js";
import { testClientDisconnect } from "./testClientDisconnect.js";
import { simulateSlowClient } from "./simulateSlowClient.js";

console.log("Running test: GET /campsites");
testGetAllCampsites();

console.log("\nRunning test: Min elevation filter");
testFilterMinElevation();

console.log("\nRunning test: Max elevation filter");
testFilterMaxElevation();

console.log("\nRunning test: Elevation range filter");
testFilterElevationRange();

console.log("\nRunning test: Status endpoint");
testStatusEndpoint();

console.log("\nRunning test: Client disconnect handling");
testClientDisconnect();

setTimeout(() => {
  console.log("\nRunning test: Simulate slow client");
  simulateSlowClient();
}, 1000);
