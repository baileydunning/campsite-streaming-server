import { db } from "../db/lmdb.js";
import { Campsite } from "../models/Campsite.js";

export function* getFilteredCampsites({ minElevation, maxElevation }) {
  // Iterate through each key-value pair in the database within the range of "camp_" keys
  for (let { key, value } of db.getRange({
    start: "camp_",
    end: "camp_\uffff",
  })) {
    let campsite;
    try {
      campsite = Campsite.fromRaw(value);
    } catch (err) {
      console.error(`[ERROR] Failed to parse campsite ${key}:`, err);
      continue;
    }
    if (!campsite) {
      console.error(`[ERROR] Invalid campsite data for key ${key}`);
      continue;
    }
    if (
      (minElevation !== null && campsite.elevation_ft < minElevation) ||
      (maxElevation !== null && campsite.elevation_ft > maxElevation)
    ) {
      continue;
    }
    // Yield the valid campsite as a result (a copy of the object to avoid mutation)
    yield { value: campsite };
  }
}