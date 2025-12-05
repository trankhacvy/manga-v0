#!/usr/bin/env tsx
/**
 * Setup script for Supabase Storage buckets
 * Run this script to initialize storage buckets for the manga IDE
 *
 * Usage: npx tsx scripts/setup-storage.ts
 */

import { createClient } from "@supabase/supabase-js";
require("dotenv").config({ path: ".env.local" });

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("supabaseUrl", supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_URL);
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BucketConfig {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}

const BUCKETS: BucketConfig[] = [
  {
    id: "manga-panels",
    name: "manga-panels",
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  },
  {
    id: "character-references",
    name: "character-references",
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  },
  {
    id: "page-thumbnails",
    name: "page-thumbnails",
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  },
  {
    id: "panel-sketches",
    name: "panel-sketches",
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  },
];

async function setupBucket(config: BucketConfig): Promise<boolean> {
  console.log(`\n📦 Setting up bucket: ${config.name}`);

  // Check if bucket exists
  const { data: existingBuckets } = await supabase.storage.listBuckets();
  const bucketExists = existingBuckets?.some((b) => b.id === config.id);

  if (bucketExists) {
    console.log(`   ✓ Bucket already exists`);
    return true;
  }

  // Create bucket
  const { data, error } = await supabase.storage.createBucket(config.id, {
    public: config.public,
    fileSizeLimit: config.fileSizeLimit,
    allowedMimeTypes: config.allowedMimeTypes,
  });

  if (error) {
    console.error(`   ❌ Failed to create bucket: ${error.message}`);
    return false;
  }

  console.log(`   ✓ Bucket created successfully`);
  console.log(`   - Public: ${config.public}`);
  console.log(
    `   - Size limit: ${(config.fileSizeLimit / 1024 / 1024).toFixed(1)}MB`
  );
  console.log(`   - Allowed types: ${config.allowedMimeTypes.join(", ")}`);

  return true;
}

async function main() {
  console.log("🚀 Setting up Supabase Storage buckets for Manga IDE\n");
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  let successCount = 0;
  let failCount = 0;

  for (const bucket of BUCKETS) {
    const success = await setupBucket(bucket);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n✅ Setup complete!`);
  console.log(`   - ${successCount} buckets ready`);
  if (failCount > 0) {
    console.log(`   - ${failCount} buckets failed`);
  }

  console.log("\n📝 Next steps:");
  console.log("   1. Run migrations: npm run db:migrate");
  console.log("   2. Verify buckets in Supabase dashboard");
  console.log("   3. Test image upload functionality\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Setup failed:", error);
  process.exit(1);
});
