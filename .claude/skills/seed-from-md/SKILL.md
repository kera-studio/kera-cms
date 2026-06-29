---
name: seed-from-md
description: Draft localized content for any kera-cms Strapi collection into a reviewable Czech JSON file, push it to remote staging after the user approves, then push the English version automatically (no second review). Use when the user has source copy (a markdown brief, a doc, notes) and wants it seeded into a CMS collection in cs + en.
---

# Seed a Strapi collection from source copy (cs → approve → push → en)

Turn raw source copy into curated, localized entries in **any** kera-cms `collectionType`. The core loop is the same regardless of collection:

1. **Draft Czech into a JSON file** matching the collection's API shape.
2. **Show it / let the user approve** the Czech draft (this is the one review gate).
3. **Push the approved CS entry** to remote.
4. **Push the English version automatically** — no second review step.

Repeat per entry. The user usually wants entries done **one at a time**.

This is curation, not a mechanical dump: clean titles, fix source typos, apply Czech typography, drop editorial TODO/asides, and restructure prose into the collection's components. When a similar entry already exists, fetch it first and match its editorial style.

## Auth + remote

- Base URL: `https://kera-cms-staging.up.railway.app`, REST under `/api`. (`.env` `REMOTE_URL` is the `/admin` of the same host.)
- Auth: `CMS_API_KEY` from `.env`, sent as `Authorization: Bearer <key>`. **Writes need a full-access key** — a read-only key returns `403` on POST/PUT. Read the key fresh from `.env` each run (it may be rotated).
- Prefer surgical REST per-entry writes over `transfer:push` (which moves the whole dataset).

## Step 1 — Learn the collection before drafting

Don't guess the shape. **The schema files are the source of truth**; a reference entry is a bonus when one exists. For the target collection `<plural>` (e.g. `selfservice-activities`, `workshops`, `articles`):

1. **Read the schema + every related schema (required — works even for an empty collection).**
   - Collection: `src/api/<singular>/content-types/<singular>/schema.json`. Note which fields are i18n-localized, required, enums, relations, dynamic zones.
   - **Follow every reference recursively:** for each `component`, read `src/components/<category>/<name>.json`; for each `dynamiczone`, read every component it lists; for nested components inside those, recurse again; for each `relation`, read the target collection's `src/api/<target>/content-types/<target>/schema.json` to learn what a valid related entry looks like and which of its fields you can set by `documentId`. This gives you the complete shape without any existing data.
2. **Fetch a reference entry if the collection is non-empty** — to copy editorial style and field conventions on top of the schema:
   - List: `GET /api/<plural>?locale=cs` (and `?locale=en` to mirror the EN glossary/style). **If this returns `data: []` the collection is empty — skip to step 3 and rely on the schemas from step 1** for structure (and ask the user for any style preferences not implied by the schema).
   - Full: `GET /api/<plural>/:documentId?locale=cs&populate[<comp>][populate]=*&populate[<dynzone>]=true&populate[<relation>]=true`.
   - **Populate caveats:** `populate[<dynamicZone>]=*` errors — use `=true`. Populating a relation with `=*` can error on odd field keys (e.g. `Invalid key Leader`) — fall back to `populate[<relation>]=true`.
3. **Resolve relation documentIds at runtime** (verify, don't trust stale ids) — `GET /api/<related-plural>` and pick by name. If a needed related collection is itself empty, tell the user it must be created first (or leave the optional relation unset).

## Step 2 — Draft Czech into a JSON file

Write a small Node ESM script (run with system `node`) that builds the payload and **writes it to the scratchpad as `<slug>.cs.json`**, with the network call gated behind a `--push` flag so drafting and pushing are separate. Read `CMS_API_KEY` from `.env` inside the script.

Payload is `{ data: { …fields, locale:'cs' } }`. Conventions:
- Scalars as-is; component fields as nested objects; repeatable components as arrays of objects; a dynamic zone as an array of `{ __component, ... }`.
- **Relations are set by `documentId`** — a string for single relations, an array for to-many.
- Rich-text (`blocks`) fields use this block JSON; helper functions keep it readable:

```js
const t  = (s)    => ({ type:'text', text:s });
const h  = (l, s) => ({ type:'heading', level:l, children:[t(s)] });
const p  = (s)    => ({ type:'paragraph', children:[t(s)] });
const li = (s)    => ({ type:'list-item', children:[t(s)] });
const ul = (a)    => ({ type:'list', format:'unordered', children:a.map(li) });
const ol = (a)    => ({ type:'list', format:'ordered',   children:a.map(li) });
```

### Editorial defaults (Czech)
- Clean the title (strip section prefixes); derive `slug` consistently with existing entries.
- Use Czech quotes `„ "` and en-dash `–`; fix source typos.
- Drop editorial TODO notes, cross-sell asides, and anything the reference entry omits.
- Split long prose into the collection's intended components (e.g. multiple rich-text blocks so media can be inserted between them) rather than one wall of text.

## Step 3 — Review gate (CS only)

Show the draft (render the JSON readably, or point at `<slug>.cs.json`). **Wait for the user's approval.** If the user says to push without drafting/review, skip the wait. This is the *only* review gate — EN does not get one.

## Step 4 — Push CS, then auto-push EN

Strapi 5 i18n: all locales share **one `documentId`**. Create CS, capture its documentId, then attach EN to it — automatically, in the same run, no extra approval.

1. `POST /api/<plural>?locale=cs` with the CS payload → `201`, returns `data.documentId`.
2. Build the EN payload (translate; keep relations by the same documentIds — they're shared across locales; localize `title`/`slug`/text fields).
3. `PUT /api/<plural>/<documentId>?locale=en` with the EN payload → `200`.

Save `<slug>.en.json` to the scratchpad too. REST create **publishes** the entry (sets `publishedAt`); if the user wants drafts, unpublish afterward.

### EN translation style
Mirror the reference EN entry's glossary and tone. Keep relation documentIds identical to CS. Don't translate values the reference leaves in Czech (check the reference before assuming).

## Step 5 — Verify

```
GET /api/<plural>/<documentId>?locale=cs&populate[<comp>][populate]=*&populate[<dynzone>]=true&populate[<relation>]=true
```
Confirm for **both** locales: localized fields differ, shared/relation fields match, component & dynamic-zone counts are right.

## Worked example — `selfservice-activity` (from `activities_texts.md`)

This skill was first built for seeding self-service studio activities; use it as the concrete template.

- **Schema:** `selfservice-activity` (i18n, draft&publish): `title`, `slug` (uid), `base` (component `activity.base`, required), `content` (dynamiczone: `content.richtext` / `content.media-row` / `content.video` / `content.premade-products`), `withPremadeProducts` (bool, not localized), `studio` (relation, not localized). `activity.base`: `cover` (media req), `description` (text req), `table` (`shared.table-row`), `price` (`shared.price` req), `additionalInfo` (`shared.list-item`), `membership` (enum `none|by-depozit|by-reservation`), `quote`/`gallery`/`unique_selling_points`/`Lectors` (relations).
- **Conventions applied:** title = clean activity name; slug `<title-kebab>-studio-brno-stankova` (EN uses EN title); `description` = lead paragraph; `price` `{ amount, currency:'CZK', withVat:true, suffix:'/ hodina' }` — **`/ hodina` kept untranslated in EN**; `membership: 'by-depozit'`; `table` one row `Úroveň dovednosti → Začátečník i pokročilý` (EN `Skill level → Beginner and advanced`); `additionalInfo` = reframed price bullets; `content` split into **two `content.richtext` blocks**; `withPremadeProducts:true` + trailing `content.premade-products` block only for the *Polotovary* activity.
- **EN glossary:** `JDEŠ GLAZOVAT`→`TIME TO GLAZE` · `MÁŠ HOTOVO`→`YOUR PIECE IS READY` · `Prostory a vybavení`→`Spaces and equipment` · `Výpal a glazování`→`Firing and glazing` · `Ukončení rezervace`→`Ending your booking` · `Konzultační/Kondiční lekce s lektorem`→`Consultation/Conditioning lessons with an instructor` · hlína→clay · vzorník→sample chart · obtáčení→trimming · engoba→engobe · přežahnutý střep→bisque-fired piece.
- **Left for the admin UI:** `cover` image + in-content video/media-row images, `quote`/`gallery` relations, per-branch pricing (source prices are placeholders), premade product listing/prices.
- **Reference ids (verify before reuse — they change):** studio Brno – Staňkova `ia9o344a165gmcyatqma40rp`; Lector Michaela Kachtíková (studio Leader + Employee) `ia8xpleucj87rai7f0fotdm2`; shared USPs `klhlce37ckefyt0ysdpnwpum`, `m6kpqj11232gtckcw5buejdy`, `z6v263cnba4wqiqfcrn9y806`; reference entry *Modelování keramiky* `n5v2iw7wyz3krplcqor8a41e`. Already seeded: *Točení na kruhu* `xrtaeqymkt73vwbo1lzx5xt0`, *Glazování a dekorování* `z44e4u2ffkv5rvfpxgafj2rx`, *Polotovary k dekorování* `l0ndj1xivr3h0vvaxh6t400c`.
