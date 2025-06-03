import { db } from "../db/lmdb.js";
import { Campsite } from "../models/Campsite.js";

export function getFilteredCampsites({ minElevation, maxElevation }) {
  try {
    // Attempt to get the campsite data from the database
    const campsites = db.getRange({ start: "camp_", end: "camp_\uffff" });

    return campsites.filter(({ value }) => {
      let campsite;

      try {
        // Attempt to create a Campsite instance from the raw data
        campsite = Campsite.fromRaw(value);
      } catch (err) {
        // If an error occurs during campsite creation, log the error and skip this entry
        console.error(
          "[ERROR] Failed to create Campsite from raw data:",
          err.message,
          value
        );
        return false;
      }

      // If the campsite is invalid (i.e., `fromRaw` returned null)
      if (!campsite) {
        console.error("[ERROR] Invalid campsite data:", value);
        return false;
      }

      // Apply elevation filtering
      if (minElevation !== null && campsite.elevation_ft < minElevation)
        return false;
      if (maxElevation !== null && campsite.elevation_ft > maxElevation)
        return false;

      return true;
    });
  } catch (err) {
    // If an error occurs in db.getRange, log the error and return an empty array
    console.error(
      "[ERROR] Failed to retrieve campsites from database:",
      err.message
    );
    return [];
  }
}
