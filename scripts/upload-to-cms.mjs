#!/usr/bin/env node
/**
 * upload-to-cms.mjs
 *
 * Recursively uploads a local folder tree into the Strapi Media Library,
 * recreating the same folder hierarchy as Media Library folders.
 *
 * Media Library folders are an ADMIN feature, so this logs in with an admin
 * account (not an API token) to create folders and place files in them.
 *
 * Usage:
 *   node scripts/upload-to-cms.mjs [source] [options]
 *
 *   source                 Folder to upload (default: PHOTOS_WEB)
 *
 * Options:
 *   --url <url>            Strapi base URL (default: $STRAPI_URL or http://localhost:1337)
 *   --wrap <name>         Nest everything under a single top-level folder
 *                         (default: upload source's children at the library root)
 *   --dry-run             Print the plan without creating folders or uploading
 *   -h, --help            Show this help
 *
 * Credentials (admin login) come from env, or you'll be prompted:
 *   STRAPI_ADMIN_EMAIL, STRAPI_ADMIN_PASSWORD
 *
 * Re-running is safe: existing folders are reused and files already present
 * in a folder (matched by name) are skipped.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// ---- args ------------------------------------------------------------------
const argv = process.argv.slice(2);
let SOURCE = "PHOTOS_WEB";
let BASE_URL = process.env.STRAPI_URL || "http://localhost:1337";
let WRAP = null;
let DRY_RUN = false;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--dry-run") DRY_RUN = true;
  else if (a === "--url") BASE_URL = argv[++i];
  else if (a === "--wrap") WRAP = argv[++i];
  else if (a === "-h" || a === "--help") {
    console.log(fs.readFileSync(new URL(import.meta.url)).toString().split("\n").slice(1, 38).join("\n").replace(/^ \*\/?/gm, ""));
    process.exit(0);
  } else if (!a.startsWith("-")) SOURCE = a;
  else { console.error(`Unknown option: ${a}`); process.exit(1); }
}

BASE_URL = BASE_URL.replace(/\/+$/, "").replace(/\/admin$/, "");
const SOURCE_ABS = path.resolve(SOURCE);

if (!fs.existsSync(SOURCE_ABS) || !fs.statSync(SOURCE_ABS).isDirectory()) {
  console.error(`Error: source '${SOURCE}' is not a directory.`);
  process.exit(1);
}

// ---- helpers ---------------------------------------------------------------
const MIME = {
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".heic": "image/heic", ".avif": "image/avif", ".pdf": "application/pdf",
};

function ask(query, muted = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (muted) {
      rl._writeToOutput = (str) =>
        rl.output.write(str.includes(query) ? str : "");
    }
    rl.question(query, (ans) => {
      rl.close();
      if (muted) rl.output.write("\n");
      resolve(ans.trim());
    });
  });
}

// List image/asset files directly in a directory (no recursion), sorted.
function filesIn(dir) {
  return fs.readdirSync(dir)
    .filter((n) => !n.startsWith("."))                  // drop .DS_Store etc.
    .filter((n) => fs.statSync(path.join(dir, n)).isFile())
    .filter((n) => MIME[path.extname(n).toLowerCase()]) // only known asset types
    .sort();
}

function subdirsIn(dir) {
  return fs.readdirSync(dir)
    .filter((n) => !n.startsWith("."))
    .filter((n) => fs.statSync(path.join(dir, n)).isDirectory())
    .sort();
}

// ---- Strapi admin API ------------------------------------------------------
let TOKEN = null;
const authHeaders = () => ({ Authorization: `Bearer ${TOKEN}` });

async function api(pathname, init = {}) {
  const res = await fetch(`${BASE_URL}${pathname}`, init);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new Error(`${init.method || "GET"} ${pathname} -> ${res.status} ${msg}`);
  }
  return json;
}

async function login(email, password) {
  const json = await api("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const token = json?.data?.token;
  if (!token) throw new Error("Login succeeded but no token returned.");
  return token;
}

// Normalize the folders list into a Map keyed by `${parentId|0}/${name}` -> id
async function loadFolderIndex() {
  const json = await api("/upload/folders?pagination[pageSize]=1000&populate=parent", { headers: authHeaders() });
  const list = json?.data ?? json?.results ?? json ?? [];
  const index = new Map();
  for (const f of list) {
    const parentId = f.parent?.id ?? f.parent ?? 0;
    index.set(`${parentId || 0}/${f.name}`, f.id);
  }
  return index;
}

// Existing file names per folder id (for skip-on-rerun). Returns Set of `${folderId|0}::name`.
async function loadFileIndex() {
  const set = new Set();
  let page = 1;
  for (;;) {
    const json = await api(`/upload/files?pagination[page]=${page}&pagination[pageSize]=100&populate=folder`, { headers: authHeaders() });
    const list = json?.results ?? json?.data ?? [];
    for (const file of list) {
      const folderId = file.folder?.id ?? file.folder ?? 0;
      set.add(`${folderId || 0}::${file.name}`);
    }
    const pageCount = json?.pagination?.pageCount ?? 1;
    if (page >= pageCount || list.length === 0) break;
    page++;
  }
  return set;
}

const folderIndex = new Map();
let folderCreated = 0;

async function ensureFolder(name, parentId) {
  const key = `${parentId || 0}/${name}`;
  if (folderIndex.has(key)) return folderIndex.get(key);
  if (DRY_RUN) {
    const fakeId = `new:${key}`;
    folderIndex.set(key, fakeId);
    folderCreated++;
    console.log(`  + folder  "${name}"  (parent: ${parentId ?? "root"})`);
    return fakeId;
  }
  const json = await api("/upload/folders", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name, parent: parentId ?? null }),
  });
  const id = json?.data?.id;
  if (!id) throw new Error(`Folder "${name}" created but no id returned.`);
  folderIndex.set(key, id);
  folderCreated++;
  console.log(`  + folder  "${name}"  (id ${id})`);
  return id;
}

let uploaded = 0, skipped = 0, failed = 0;

async function uploadFile(absPath, folderId, fileSet) {
  const name = path.basename(absPath);
  if (fileSet.has(`${folderId || 0}::${name}`)) {
    skipped++;
    return;
  }
  if (DRY_RUN) {
    console.log(`    · ${name}`);
    uploaded++;
    return;
  }
  try {
    const buf = fs.readFileSync(absPath);
    const type = MIME[path.extname(name).toLowerCase()] || "application/octet-stream";
    const form = new FormData();
    form.append("files", new Blob([buf], { type }), name);
    form.append("fileInfo", JSON.stringify({ name, folder: folderId ?? null }));
    await api("/upload", { method: "POST", headers: authHeaders(), body: form });
    uploaded++;
    process.stdout.write(`    ✓ ${name}\n`);
  } catch (err) {
    failed++;
    console.error(`    ✗ ${name} — ${err.message}`);
  }
}

// Depth-first walk: create the folder for `dir`, upload its files, recurse.
async function walk(dir, parentId, fileSet) {
  const files = filesIn(dir);
  if (files.length) console.log(`📁 ${path.relative(SOURCE_ABS, dir) || "."}`);
  for (const f of files) await uploadFile(path.join(dir, f), parentId, fileSet);

  for (const sub of subdirsIn(dir)) {
    const id = await ensureFolder(sub, parentId);
    await walk(path.join(dir, sub), id, fileSet);
  }
}

// ---- main ------------------------------------------------------------------
(async () => {
  console.log(`Target : ${BASE_URL}`);
  console.log(`Source : ${SOURCE_ABS}`);
  if (WRAP) console.log(`Wrap   : under "${WRAP}"`);
  if (DRY_RUN) console.log("Mode   : DRY RUN (no changes)\n");
  else console.log("");

  const fileSet = new Set();

  if (!DRY_RUN) {
    const email = process.env.STRAPI_ADMIN_EMAIL || (await ask("Admin email: "));
    const password = process.env.STRAPI_ADMIN_PASSWORD || (await ask("Admin password: ", true));
    try {
      TOKEN = await login(email, password);
      console.log("✓ Logged in.\n");
    } catch (err) {
      console.error(`✗ Login failed: ${err.message}`);
      console.error(`  Check the URL (${BASE_URL}) and that the admin account exists.`);
      process.exit(1);
    }
    for (const [k, v] of await loadFolderIndex()) folderIndex.set(k, v);
    for (const k of await loadFileIndex()) fileSet.add(k);
  }

  let rootParent = null;
  if (WRAP) rootParent = await ensureFolder(WRAP, null);

  await walk(SOURCE_ABS, rootParent, fileSet);

  console.log("\n──────────────");
  console.log(`Folders created : ${folderCreated}`);
  console.log(`Files uploaded  : ${uploaded}`);
  console.log(`Files skipped   : ${skipped} (already present)`);
  console.log(`Files failed    : ${failed}`);
  if (DRY_RUN) console.log("\nDry run — nothing was changed.");
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
