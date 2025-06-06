export class Campsite {
  constructor({ id, name, elevation_ft, region, location }) {
    if (!id || typeof id !== "string") {
      console.error(
        "[MODEL ERROR] Invalid or missing 'id' in campsite data:",
        id
      );
      throw new Error("Invalid or missing 'id' in campsite data.");
    }

    if (!name || typeof name !== "string") {
      console.error(
        "[MODEL ERROR] Invalid or missing 'name' in campsite data:",
        name
      );
      throw new Error("Invalid or missing 'name' in campsite data.");
    }

    if (elevation_ft == null || isNaN(Number(elevation_ft))) {
      console.error(
        "[MODEL ERROR] Invalid or missing 'elevation_ft' in campsite data:",
        elevation_ft
      );
      throw new Error("Invalid or missing 'elevation_ft' in campsite data.");
    }

    if (!region || typeof region !== "string") {
      console.error(
        "[MODEL ERROR] Invalid or missing 'region' in campsite data:",
        region
      );
      throw new Error("Invalid or missing 'region' in campsite data.");
    }

    if (
      !location ||
      typeof location !== "object" ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      console.error(
        "[MODEL ERROR] Invalid or missing 'location' in campsite data:",
        location
      );
      throw new Error(
        "Invalid or missing 'location' in campsite data. Expected { latitude: number, longitude: number }"
      );
    }

    this.id = id;
    this.name = name;
    this.elevation_ft = Number(elevation_ft);
    this.region = region;
    this.location = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  static fromRaw(raw) {
    if (!raw || typeof raw !== "object") {
      console.error("[MODEL ERROR] Invalid input to Campsite.fromRaw:", raw);
      throw new Error("Invalid input: raw data must be an object.");
    }

    try {
      return new Campsite(raw);
    } catch (err) {
      console.error(
        "[MODEL ERROR] Failed to create Campsite instance:",
        err.message
      );
      throw new Error(`Failed to create Campsite instance: ${err.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      elevation_ft: this.elevation_ft,
      region: this.region,
      location: this.location,
    };
  }
}
