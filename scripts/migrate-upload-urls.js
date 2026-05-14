#!/usr/bin/env node
/**
 * One-shot migration: rewrite legacy "/uploads/<file>" URLs in the Strapi
 * `files` table to absolute MinIO URLs, after the assets have already been
 * copied into the bucket with the same keys.
 *
 * Reads DATABASE_URL from .env in the project root. The .env value pointing
 * at postgres.railway.internal only resolves inside Railway's network — for
 * a one-off local run, temporarily set DATABASE_URL to the public proxy URL
 * (Railway > Postgres > Connect > "Public Network").
 *
 * Usage:
 *   node scripts/migrate-upload-urls.js           # dry run
 *   node scripts/migrate-upload-urls.js --apply   # commit
 */

const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, "..", ".env"));

const OLD_PREFIX = "/uploads/";
const NEW_PREFIX =
  "https://s3-bucket-staging.up.railway.app/kera-cms-bucket/";
const NEW_PROVIDER = "@avorati/strapi-provider-upload-minio";

const APPLY = process.argv.includes("--apply");

function rewriteUrl(url) {
  if (typeof url === "string" && url.startsWith(OLD_PREFIX)) {
    return NEW_PREFIX + url.slice(OLD_PREFIX.length);
  }
  return url;
}

function rewriteFormats(formats) {
  if (!formats || typeof formats !== "object") {
    return { changed: false, next: formats };
  }
  let changed = false;
  const next = {};
  for (const [k, v] of Object.entries(formats)) {
    if (
      v &&
      typeof v === "object" &&
      typeof v.url === "string" &&
      v.url.startsWith(OLD_PREFIX)
    ) {
      next[k] = { ...v, url: NEW_PREFIX + v.url.slice(OLD_PREFIX.length) };
      changed = true;
    } else {
      next[k] = v;
    }
  }
  return { changed, next };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  // SSL is controlled by the connection string (?sslmode=…) or PGSSLMODE.
  // Railway's public proxy speaks plain TCP and rejects SSL; the internal
  // postgres.railway.internal endpoint expects SSL with a self-signed cert
  // (append ?sslmode=no-verify to DATABASE_URL in that case).
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  console.log(`Mode:   ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`From:   ${OLD_PREFIX}`);
  console.log(`To:     ${NEW_PREFIX}`);
  console.log(`Set provider: ${NEW_PROVIDER}\n`);

  const { rows } = await client.query(
    `SELECT id, url, formats, provider
       FROM files
      WHERE url LIKE $1 OR formats::text LIKE $2`,
    [`${OLD_PREFIX}%`, `%${OLD_PREFIX}%`],
  );

  console.log(`Candidate rows: ${rows.length}`);

  let willChangeUrl = 0;
  let willChangeFormats = 0;
  let willChangeProvider = 0;
  const preview = [];

  for (const row of rows) {
    const newUrl = rewriteUrl(row.url);
    const { changed: formatsChanged } = rewriteFormats(row.formats);
    if (newUrl !== row.url) willChangeUrl++;
    if (formatsChanged) willChangeFormats++;
    if (row.provider !== NEW_PROVIDER) willChangeProvider++;
    if (preview.length < 3 && (newUrl !== row.url || formatsChanged)) {
      preview.push({
        id: row.id,
        oldUrl: row.url,
        newUrl,
        formatsChanged,
      });
    }
  }

  console.log(`  url    rewrites: ${willChangeUrl}`);
  console.log(`  formats rewrites: ${willChangeFormats}`);
  console.log(`  provider updates: ${willChangeProvider}`);

  if (preview.length > 0) {
    console.log(`\nPreview (first ${preview.length}):`);
    for (const p of preview) {
      console.log(`  id=${p.id}`);
      console.log(`    ${p.oldUrl}`);
      console.log(` -> ${p.newUrl}`);
      console.log(`    formats changed: ${p.formatsChanged}`);
    }
  }

  if (!APPLY) {
    console.log(`\nDRY RUN. Re-run with --apply to commit.`);
    await client.end();
    return;
  }

  await client.query("BEGIN");
  try {
    let updated = 0;
    for (const row of rows) {
      const newUrl = rewriteUrl(row.url);
      const { changed: formatsChanged, next: newFormats } = rewriteFormats(
        row.formats,
      );
      const providerChanged = row.provider !== NEW_PROVIDER;
      if (
        newUrl === row.url &&
        !formatsChanged &&
        !providerChanged
      ) {
        continue;
      }
      await client.query(
        `UPDATE files
            SET url = $1,
                formats = $2,
                provider = $3
          WHERE id = $4`,
        [
          newUrl,
          newFormats ? JSON.stringify(newFormats) : null,
          NEW_PROVIDER,
          row.id,
        ],
      );
      updated++;
    }
    await client.query("COMMIT");
    console.log(`\nCommitted ${updated} updates.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Rolled back due to error:", e);
    process.exitCode = 1;
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
