export class Campsite {
  constructor({ id, name, elevation_ft, location }) {
    if (!id || typeof id !== "string") {
      console.error("[MODEL ERROR] Invalid or missing 'id' in campsite data:", id);
      throw new Error("Invalid or missing 'id' in campsite data.");
    }

    if (!name || typeof name !== "string") {
      console.error("[MODEL ERROR] Invalid or missing 'name' in campsite data:", name);
      throw new Error("Invalid or missing 'name' in campsite data.");
    }

    if (elevation_ft == null || isNaN(Number(elevation_ft))) {
      console.error("[MODEL ERROR] Invalid or missing 'elevation_ft' in campsite data:", elevation_ft);
      throw new Error("Invalid or missing 'elevation_ft' in campsite data.");
    }

    if (!location) {
      console.error("[MODEL ERROR] Missing 'location' in campsite data:", location);
      throw new Error("Missing 'location' in campsite data.");
    }

    this.id = id;
    this.name = name;
    this.elevation_ft = Number(elevation_ft);
    this.location = location;
  }

  static fromRaw(raw) {
    if (!raw || typeof raw !== "object") {
      console.error("[MODEL ERROR] Invalid input to Campsite.fromRaw:", raw);
      return null;
    }

    try {
      return new Campsite(raw);
    } catch (err) {
      console.error("[MODEL ERROR]", err.message);
      return null;
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      elevation_ft: this.elevation_ft,
      location: this.location,
    };
  }
}
