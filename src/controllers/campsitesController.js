import { getFilteredCampsites } from "../services/campsitesService.js";
import { createCampsiteStream } from "../streams/createCampsiteStream.js";
import { parseElevationParams } from "../utils/parseElevationParams.js";

export function campsitesController(req, res, searchParams) {
  // Validate query parameters
  const { isValid, minElevation, maxElevation, errorMessage } =
    parseElevationParams(searchParams);

  if (!isValid) {
    console.log("[ERROR]", errorMessage);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: errorMessage }));
    return;
  }

  // Call the service to get filtered campsites based on query parameters
  const filtered = getFilteredCampsites({minElevation, maxElevation});
  
  // Create a stream to send the filtered campsites to the client
  createCampsiteStream(filtered, res, req);
}