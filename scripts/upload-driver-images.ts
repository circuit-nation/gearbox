/**
 * Bulk-upload local driver SVGs and wire them into MongoDB + Tier Nation.
 *
 * Expects files like: images/f1/Entity Lando Norris.svg, images/motogp/Entity Marc Marquez.svg
 *
 * Usage:
 *   pnpm upload:driver-images                 # upload to S3 + update existing MongoDB drivers
 *   pnpm upload:driver-images --dry-run       # print matches only
 *   pnpm upload:driver-images --entities      # also create Tier Nation standalone entities
 *   pnpm upload:driver-images --write-json    # refresh src/data/driver_images.json (s3:// refs)
 *
 * Requires: CN_MONGODB_URI (or MONGODB_URI), CN_S3_BUCKET, CN_AWS_* for upload.
 * For --entities: TIER_NATION_API_BASE_URL, TIER_NATION_ADMIN_USERNAME, TIER_NATION_ADMIN_PASSWORD
 */
import { config } from "dotenv";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import { DriverModel } from "@/lib/models/core.models";
import { toStoredS3Value } from "@/lib/image-storage";
import {
  isAllowedImageExtension,
  isAllowedMimeTypeForExtension,
  normalizeExtension,
} from "@/lib/image-upload";
import type { AdminEntityInput, AdminEntitiesBody } from "@/lib/tier-nation/types";

config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });

const IMAGES_ROOT = path.resolve(process.cwd(), "images");
const DATA_DIR = path.resolve(process.cwd(), "src/data");
const IMAGE_DIRS = [
  { subdir: "f1", sportTag: "F1" },
  { subdir: "motogp", sportTag: "MotoGP" },
] as const;

/** Filename label (normalized) → driver name key (normalized) for known mismatches. */
const IMAGE_NAME_ALIASES: Record<string, string> = {
  alexalbon: "alexanderalbon",
  francesobagnaia: "francescobagnaia",
  kimiantonelli: "andreakimiantonelli",
  toparkrazgatilioglu: "toprakrazgatloglu",
  valterribottas: "valtteribottas",
};

type SeedDriver = {
  name: string;
  tags?: string[];
};

type LocalImage = {
  filePath: string;
  label: string;
  sportTag: string;
};

type ResolvedUpload = {
  image: LocalImage;
  driverName: string;
  seedDriver: SeedDriver;
  storedValue: string;
};

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Matches `driver_images.json` name keys (e.g. AlexanderAlbon). */
function driverImageJsonName(fullName: string): string {
  return fullName
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function parseImageLabel(filename: string): string | null {
  const match = filename.match(/^Entity\s+(.+)\.(svg|png|webp|jpe?g)$/i);
  return match?.[1]?.trim() ?? null;
}

function readSeedDrivers(): SeedDriver[] {
  const f1 = JSON.parse(readFileSync(path.join(DATA_DIR, "f1_drivers.json"), "utf8")) as SeedDriver[];
  const motogp = JSON.parse(
    readFileSync(path.join(DATA_DIR, "motogp_riders.json"), "utf8")
  ) as SeedDriver[];
  return [...f1, ...motogp];
}

function collectLocalImages(): LocalImage[] {
  const out: LocalImage[] = [];

  for (const { subdir, sportTag } of IMAGE_DIRS) {
    const dir = path.join(IMAGES_ROOT, subdir);
    for (const filename of readdirSync(dir)) {
      const label = parseImageLabel(filename);
      if (!label) {
        continue;
      }
      out.push({
        filePath: path.join(dir, filename),
        label,
        sportTag,
      });
    }
  }

  return out.sort((a, b) => a.label.localeCompare(b.label));
}

function resolveSeedDriver(label: string, seedDrivers: SeedDriver[]): SeedDriver | null {
  let key = normalizeKey(label);
  const alias = IMAGE_NAME_ALIASES[key];
  if (alias) {
    key = alias;
  }

  const byKey = new Map(seedDrivers.map((d) => [normalizeKey(d.name), d]));
  const exact = byKey.get(key);
  if (exact) {
    return exact;
  }

  for (const driver of seedDrivers) {
    const driverKey = normalizeKey(driver.name);
    if (driverKey.includes(key) || key.includes(driverKey)) {
      return driver;
    }
  }

  return null;
}

function slugifyEntityName(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "image";
}

function buildS3Key(folder: string, entityName: string, extension: string): string {
  return `${folder}/${slugifyEntityName(entityName)}.${extension}`;
}

function contentTypeForExtension(extension: string): string {
  const map: Record<string, string> = {
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  return map[extension] ?? "application/octet-stream";
}

async function uploadFile(
  s3: S3Client,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    return;
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

function assertTierNationEnv() {
  const missing = [
    "TIER_NATION_API_BASE_URL",
    "TIER_NATION_ADMIN_USERNAME",
    "TIER_NATION_ADMIN_PASSWORD",
  ].filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    throw new Error(
      `Missing Tier Nation env in .env / .env.local: ${missing.join(", ")}. ` +
        "Example: TIER_NATION_API_BASE_URL=http://localhost:8080/api/v1"
    );
  }
}

async function createTierNationEntities(entities: AdminEntityInput[], dryRun: boolean) {
  assertTierNationEnv();

  // Dynamic import so `@/config/config` reads process.env after dotenv ran above.
  const { tierNationAdminFetch } = await import("@/lib/tier-nation/api");

  const batchSize = 20;
  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    const body: AdminEntitiesBody = { entities: batch };

    if (dryRun) {
      console.info(`[dry-run] Would create ${batch.length} Tier Nation entities.`);
      continue;
    }

    const upstream = await tierNationAdminFetch("/admin/entities", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      throw new Error(`Tier Nation entity create failed (${upstream.status}): ${text}`);
    }

    console.info(`Created ${batch.length} Tier Nation entities (batch ${i / batchSize + 1}).`);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const createEntities = process.argv.includes("--entities");
  const writeJson = process.argv.includes("--write-json");

  const bucket = process.env.CN_S3_BUCKET?.trim();
  const region = process.env.CN_AWS_S3_REGION?.trim();
  const accessKey = process.env.CN_AWS_ACCESS_KEY?.trim();
  const secretKey = process.env.CN_AWS_SECRET_KEY?.trim();
  const mongoUri = process.env.CN_MONGODB_URI ?? process.env.MONGODB_URI;

  if (!bucket || !region || !accessKey || !secretKey) {
    throw new Error("Set CN_S3_BUCKET, CN_AWS_S3_REGION, CN_AWS_ACCESS_KEY, CN_AWS_SECRET_KEY.");
  }
  if (!mongoUri) {
    throw new Error("Set CN_MONGODB_URI or MONGODB_URI.");
  }

  const seedDrivers = readSeedDrivers();
  const localImages = collectLocalImages();

  if (localImages.length === 0) {
    throw new Error(`No images found under ${IMAGES_ROOT}/f1 or ${IMAGES_ROOT}/motogp.`);
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  const resolved: ResolvedUpload[] = [];
  const unmatched: string[] = [];

  for (const image of localImages) {
    const seedDriver = resolveSeedDriver(image.label, seedDrivers);
    if (!seedDriver) {
      unmatched.push(image.label);
      continue;
    }

    const extension = normalizeExtension(path.extname(image.filePath).slice(1));
    if (!isAllowedImageExtension(extension)) {
      throw new Error(`Unsupported extension for ${image.filePath}`);
    }

    const contentType = contentTypeForExtension(extension);
    if (!isAllowedMimeTypeForExtension(extension, contentType)) {
      throw new Error(`MIME mismatch for ${image.filePath}`);
    }

    const key = buildS3Key("drivers", seedDriver.name, extension);
    const storedValue = toStoredS3Value(bucket, key);
    const body = readFileSync(image.filePath);

    await uploadFile(s3, bucket, key, body, contentType, dryRun);
    resolved.push({ image, driverName: seedDriver.name, seedDriver, storedValue });
    console.info(`${dryRun ? "[dry-run] " : ""}Uploaded ${image.label} → ${storedValue}`);
  }

  if (unmatched.length) {
    console.warn("No seed driver match for:");
    unmatched.forEach((name) => console.warn(`  - ${name}`));
  }

  await mongoose.connect(mongoUri);
  console.info("Connected to MongoDB.");

  let updatedDrivers = 0;
  for (const entry of resolved) {
    const result = await DriverModel.updateMany(
      { name: entry.driverName },
      { $set: { image: entry.storedValue } }
    );

    if (dryRun) {
      console.info(`[dry-run] Would update driver "${entry.driverName}" (${result.matchedCount} doc(s)).`);
    } else if (result.matchedCount > 0) {
      updatedDrivers += result.modifiedCount;
      console.info(`Updated driver "${entry.driverName}" (${result.modifiedCount} doc(s)).`);
    } else {
      console.warn(`No MongoDB driver named "${entry.driverName}" — run pnpm seed first.`);
    }
  }

  if (writeJson) {
    const jsonEntries = resolved.map((entry) => ({
      name: driverImageJsonName(entry.driverName),
      image: entry.storedValue,
    }));
    const outPath = path.join(DATA_DIR, "driver_images.json");
    if (!dryRun) {
      writeFileSync(outPath, `${JSON.stringify(jsonEntries, null, 2)}\n`, "utf8");
      console.info(`Wrote ${jsonEntries.length} entries to ${outPath}`);
    } else {
      console.info(`[dry-run] Would write ${jsonEntries.length} entries to ${outPath}`);
    }
  }

  if (createEntities) {
    const entities: AdminEntityInput[] = resolved.map((entry) => {
      const tags = [...(entry.seedDriver.tags ?? [])];
      const team = tags.shift();
      return {
        name: entry.driverName,
        team,
        tags: tags.length ? tags : [entry.image.sportTag],
        imageUrl: entry.storedValue,
        description: "",
      };
    });
    await createTierNationEntities(entities, dryRun);
  }

  console.info("Done.");
  console.info(`  local images:  ${localImages.length}`);
  console.info(`  uploaded:      ${resolved.length}`);
  console.info(`  unmatched:     ${unmatched.length}`);
  console.info(`  mongo updated: ${dryRun ? "(dry-run)" : updatedDrivers}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  void mongoose.disconnect();
  process.exit(1);
});
