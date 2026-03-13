#!/usr/bin/env node
/**
 * POS Instance Setup Script
 * --------------------------
 * Creates a new, independent POS instance by:
 *   1. Running the DB schema against your new Supabase project
 *   2. Creating the default admin user (abd / 2585)
 *   3. Writing a ready-to-use .env file
 *
 * Usage:
 *   1. Copy .env.setup.example → .env.setup and fill in your credentials
 *   2. npm run setup
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1. Load .env.setup
// ---------------------------------------------------------------------------
const ENV_SETUP_PATH = resolve(ROOT, ".env.setup");
if (!existsSync(ENV_SETUP_PATH)) {
  console.error("❌  .env.setup not found. Copy .env.setup.example → .env.setup and fill in your values.");
  process.exit(1);
}

const dotenv = require("dotenv");
const cfg = dotenv.parse(readFileSync(ENV_SETUP_PATH));

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "JWT_SECRET",
  "NEXT_PUBLIC_TIMEZONE",
];

const missing = required.filter((k) => !cfg[k]);
if (missing.length) {
  console.error(`❌  Missing required fields in .env.setup: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("✅  Config loaded from .env.setup");

// ---------------------------------------------------------------------------
// 2. Create Supabase Tables + Default User via PostgreSQL
// ---------------------------------------------------------------------------
async function createTablesAndUser() {
  console.log("\n📦  Creating Supabase tables...");

  const { Client } = require("pg");
  const sql = readFileSync(resolve(ROOT, "libs", "init_schema.sql"), "utf8");

  const client = new Client({ connectionString: cfg.DATABASE_URL });
  await client.connect();

  try {
    await client.query(sql);
    console.log("✅  Tables created (or already exist).");

    // Migrate existing tables that may be missing columns
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS seq_no text`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_no int`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'cashier'`);

    console.log("\n👤  Creating default admin user (abd)...");

    // Check if user already exists
    const { rows } = await client.query(
      "SELECT id FROM users WHERE username = $1",
      ["abd"]
    );

    if (rows.length > 0) {
      console.log("⚠️   User 'abd' already exists — skipping.");
    } else {
      await client.query(
        "INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)",
        ["abd", "2585", "Admin", "manager"]
      );
      console.log("✅  Default user created: username=abd  password=2585  role=manager");
    }
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// 4. Write .env file
// ---------------------------------------------------------------------------
function writeEnvFile() {
  console.log("\n📝  Writing .env file...");

  const envPath = resolve(ROOT, ".env");
  const lines = [
    `SUPABASE_URL=${cfg.SUPABASE_URL}`,
    `SUPABASE_SERVICE_ROLE_KEY=${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
    `JWT_SECRET=${cfg.JWT_SECRET}`,
    `NEXT_PUBLIC_TIMEZONE=${cfg.NEXT_PUBLIC_TIMEZONE}`,
  ].join("\n");

  writeFileSync(envPath, lines, "utf8");
  console.log(`✅  .env written to ${envPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  try {
    await createTablesAndUser();
    writeEnvFile();

    console.log("\n🎉  Setup complete! Run  npm run dev  to start the POS.");
  } catch (err) {
    console.error("\n❌  Setup failed:", err.message ?? err);
    process.exit(1);
  }
})();
