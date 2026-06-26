import { config } from "dotenv";
import path from "node:path";
import { connectToDatabase } from "@/lib/mongodb";
import { SocialWallSlotModel } from "@/lib/models/social-wall.models";
import {
  SOCIAL_WALL_SLOT_IDS,
  inferPlatformFromSlotId,
} from "@/lib/social-wall/slots";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  await connectToDatabase();

  for (const slotId of SOCIAL_WALL_SLOT_IDS) {
    await SocialWallSlotModel.updateOne(
      { slotId },
      {
        $setOnInsert: {
          slotId,
          platform: inferPlatformFromSlotId(slotId),
          isActive: false,
        },
      },
      { upsert: true }
    );
  }

  console.log("Seeded social wall slots");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
