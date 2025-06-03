import { open } from "lmdb";
import campsites from "../../data/campsites.json" assert { type: "json" };
import { Campsite } from "../models/Campsite.js";

export const db = open({
  path: "./data.lmdb",
  name: "campsites",
  compression: true,
});

export async function seedDB() {
  try {
    await db.clear();

    let successCount = 0;
    let errorCount = 0;

    await db.transaction(async () => {
      for (const raw of campsites) {
        const campsite = Campsite.fromRaw(raw);
        if (!campsite) {
          failureCount++;
          continue;
        }
        await db.put(campsite.id, campsite.toJSON());
        successCount++;
      }
    });

    console.log(
      `[INFO] Seeded ${successCount} campsites (${errorCount} errors)`
    );
  } catch (err) {
    console.error("[ERROR] Failed to seed database:", err);
    throw err;
  }
}
