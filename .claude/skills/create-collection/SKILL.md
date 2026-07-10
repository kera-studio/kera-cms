---
name: create-collection
description: Scaffold Strapi 5 collection types, components, lifecycle hooks, and admin niceties in this kera-cms repo from a TypeScript schema sketch (interfaces/types annotated with `// collection`, `// component`, `// dynamic zone`). Use when the user provides a TS schema like eventSchema.ts and asks to implement/scaffold it, or asks to add a new collection/component/content type.
---

# Create Strapi collections from a TS schema

This repo is **Strapi 5.37** (TypeScript, factory pattern, pnpm). The user hands you a TypeScript file that sketches a content model: `interface`/`type` declarations annotated with comments like `// collection`, `// component`, `// dynamic zone`. Turn it into real Strapi files following the conventions and constraints below.

## Workflow

1. **Read the TS schema fully.** Note every `// collection`, `// component`, `// dynamic zone`, enum (`type X = "a"|"b"`), `extends`, optional `?`, and inline comments (e.g. "multiline text", "default false", "based on title").
2. **Inspect existing conventions first** — read one existing `src/api/*/content-types/*/schema.json`, one `src/components/*/*.json`, and one `src/api/*/controllers|routes|services/*.ts` so the scaffold matches naming, i18n, draftAndPublish, and the factory boilerplate exactly.
3. **Surface the design decisions and confirm with the user** (see "Decisions to confirm"). Map the constraints below before writing — several TS shapes don't translate 1:1.
4. **Scaffold** components → collections → API boilerplate → lifecycle hooks.
5. **Validate** (see "Validation").
6. **Always apply the full-width edit layout AND friendly field labels** to every new collection (and any new components) — see "Full-width edit layouts" and "Friendly field labels". These are defaults, not opt-in: register the UID in the `src/index.ts` seed loop so every field renders one-per-row at size 12 and gets a readable display name (see naming convention above — display name ≠ API key). Apply the *other* admin niceties (sidebar grouping prefixes) only if requested.
7. Don't commit unless asked. This repo commits direct to `main`.

## Field naming convention (enforce on every attribute)

**Attribute keys must be camelCase** (`name`, `surname`, `coverPhoto`, `internalDisplayName`, `openingHours`…). This applies to every field on every collection and component you scaffold. Convert whatever the TS schema sketch uses (`PostalCode` → `postalCode`, `cover_photo` → `coverPhoto`). Never PascalCase, never snake_case.

**Every field also gets a nice readable display name** via the admin label seed in `src/index.ts` (see "Friendly field labels" — this is a default, not opt-in). The display name is human prose, NOT the API key: `coverPhoto` → `"Cover photo"`, `internalDisplayName` → `"Internal display name"`. Display name ≠ API key, always.

- The key IS the API field name (REST/GraphQL payload key) — camelCase applies uniformly to the API.
- `info.singularName`/`pluralName` and the `api::<name>.<name>` UID stay lowercase-kebab (Strapi requires it) — this rule is **only** about `attributes` keys.
- If any map in `src/index.ts` (labels, readonly, main fields) references a field, use the camelCase key there too.
- Existing collections contain legacy PascalCase/snake_case keys — don't mimic them; new fields are always camelCase. Don't rename existing keys unless explicitly asked (it's an API + DB-column breaking change).

## File layout (match exactly)

- Collection: `src/api/<kebab>/content-types/<kebab>/schema.json` plus `controllers/<kebab>.ts`, `routes/<kebab>.ts`, `services/<kebab>.ts`.
  - The three boilerplate files use `factories.createCoreController|Router|Service('api::<name>.<name>')`. Generate them with a bash loop — they're identical except the UID. Note `controller` imports without a trailing `;` after the import, `router`/`service` import with `;` (match the existing files).
- Component: `src/components/<category>/<name>.json`, with `"collectionName": "components_<category>_<plural_snake>"`.
- Lifecycle: `src/api/<name>/content-types/<name>/lifecycles.ts`.
- Admin label seed: `src/index.ts` `bootstrap`.

## TS → Strapi mapping

| TS | Strapi |
|---|---|
| `type X = "a" \| "b"` | `enumeration` with `enum: [...]` |
| `interface {} // component` | component under a category |
| `type/interface // collection` | `collectionType` |
| union type `// dynamic zone` | `dynamiczone` listing its component variants |
| `string` (plain) | `string`; comment "multiline" → `text`; "rich text" → `blocks` |
| `string[]` | repeatable component with one `value: string` (Strapi has **no** native string array) — or a typed repeatable component if the data deserves it (e.g. dates → `event-date { date: datetime }`) |
| `slug` | `uid` with `targetField` (must be top-level — see constraints) |
| optional `?` | omit `required` |
| `number` | `integer` (counts) or `decimal` (money) |
| relation field | see relation rules below |

## Hard Strapi constraints (these bit us — honor them)

1. **`uid` type is only allowed at content-type level, never in a component.** So a `slug` (uid) and its `targetField` (usually `title`) must be **top-level** on each collection.
2. **Dynamic zones cannot be nested inside components.** A `content` dynamic-zone field must be **top-level** on each collection — it can't go in a shared base component. (Duplicate the field definition across collections; it references the same components.)
3. **Components support only one-way relations** (no `inversedBy`/`mappedBy`). Use `oneToOne` (single) or `oneToMany` (many) with just `target`. This is fine for "activity → one gallery/quote" and satisfies m2o intent (targets stay reusable).
4. **No content-type inheritance.** For `interface B extends A`: extract A's shared fields into a base **component** (e.g. `activity.base`) and embed it (single, `required`) in each collection, then add the distinct fields. But fields blocked by constraints 1–2 (uid/title/dynamic zone) stay top-level and are duplicated.
5. **Nested components are allowed**: dynamic zone → component → repeatable component is valid (e.g. `media-row` → repeatable `media-item`).
6. **Auto-generated fields must NOT be `required`.** Input validation runs *before* the `beforeCreate` lifecycle sets the value, so a required auto field would fail validation. Add a `description` noting it's auto-generated instead.

### Relation cardinality
- Top-level collection ↔ collection: real bidirectional relations OK — `manyToOne` with `inversedBy` on one side, `oneToMany` with `mappedBy` on the reverse.
- Inside a component: one-way only (constraint 3).

## i18n & draft/publish
- Apply per existing convention: content-y collections get `pluginOptions.i18n.localized: true` + `draftAndPublish: true`.
- Localize translatable fields (title, slug, text, media, content, base component). Keep enums, numbers, booleans, and operational relations **non-localized** (`localized: false`).
- Data/asset collections (stock, galleries) usually `i18n: false`.
- ⚠️ A localized **component** field localizes *all* its contents together (price/enums get per-locale copies). Mention this trade-off.

## Auto-generating an `internalDisplayName`

Add `lifecycles.ts`. Two patterns:

- **From a sibling field (e.g. title):**
```ts
function setInternalDisplayName(event) {
  const { data } = event.params;
  if (data?.title) data.internalDisplayName = data.title;
}
export default {
  beforeCreate(event) { setInternalDisplayName(event); },
  beforeUpdate(event) { setInternalDisplayName(event); },
};
```
- **From a relation (e.g. `product.title – location`):** resolve the relation id (it arrives as a raw id, an array, or `{connect:[...]}`/`{set:[...]}`), `strapi.db.query(uid).findOne(...)`, build the string. On update the relation may be absent → return early and leave the name unchanged. See `src/api/premade-product/content-types/premade-product/lifecycles.ts` for the `resolveProductId` helper.

## Admin niceties

### Group collections in the sidebar (only if asked)
The sidebar is alphabetical with no folders. Prefix `info.displayName` to cluster: `"Activity – Group"`, `"Activity – Workshop"`, `"Shop – Product"`, `"Content – Gallery"`. Use the en-dash `–` to match the repo's existing `"Deprecated –"` convention. This changes display only — UIDs/routes/tables are untouched.

### Friendly field labels — DEFAULT, always apply
`schema.json` has **no per-field label**; the admin derives labels from the attribute key, and a raw camelCase key makes an ugly label. So **every field on every new collection/component gets a readable label** (`coverPhoto` → `"Cover photo"`) seeded via the Content-Manager config in `src/index.ts` `bootstrap`:

```ts
async function seedAdminLabels(strapi) {
  const ct = strapi.plugin('content-manager').service('content-types');
  for (const [uid, labels] of Object.entries(CONTENT_TYPE_LABELS)) {
    const contentType = strapi.contentType(uid);
    if (!contentType) continue;
    const config = await ct.findConfiguration(contentType);   // {uid, settings, metadatas, layouts}
    for (const [field, label] of Object.entries(labels)) {
      const m = config.metadatas?.[field];
      if (!m) continue;
      m.edit = { ...(m.edit ?? {}), label };
      if (m.list) m.list = { ...m.list, label };
    }
    await ct.updateConfiguration(contentType, config);
  }
  // components: strapi.plugin('content-manager').service('components')
  //   with strapi.components['<category>.<name>'] (has .uid + .category)
}
```
- Config lives in the DB (`strapi_core_store_settings`), not in schema files — this seed makes it version-controlled.
- Default stored label = the raw attribute key; labels are re-applied every boot, so editor changes via "Configure the view" get overwritten. Tell the user to manage labels in `src/index.ts` (remove a field from the map to hand it to the admin).
- See the full working maps in `src/index.ts`.

### Full-width edit layouts (one field per row, no columns) — DEFAULT, always apply
Apply this to **every** new collection (and any new component), even when the user asks for nothing else. The edit form arranges fields on a 12-column grid via `config.layouts.edit` — an array of rows, each row an array of `{ name, size }` (sizes sum to ≤ 12 per row). To make every field full width with no side-by-side columns, rebuild the layout as one field per row at `size: 12`. Do it in the same `src/index.ts` bootstrap, alongside labels:

```ts
function makeFullWidth(config): boolean {
  const edit = config?.layouts?.edit;
  if (!Array.isArray(edit) || edit.length === 0) return false;
  const flat = edit.flat().filter((el) => el && el.name); // preserves field order
  config.layouts.edit = flat.map((el) => [{ ...el, size: 12 }]);
  return true;
}
```
- `size: 12` is valid for **every** field type: `component`/`dynamiczone`/`json`/`richtext`/`blocks` are locked to 12 (`isResizable: false`), and all resizable types (string, text, number, boolean, enum, media, relation, uid…) allow up to 12. So no per-type checks are needed.
- Flattening the *existing* layout (rather than enumerating attributes) preserves field order and automatically picks up any fields added later.
- Apply to both content types and components; combine its changed-flag with the label one so a single `updateConfiguration` call persists both. Re-applied every boot.
- **The seed loop only processes UIDs present in `CONTENT_TYPE_LABELS` / `COMPONENT_LABELS`.** Every new collection/component is registered there anyway (labels are a default — see "Friendly field labels"), so full-width comes along in the same `updateConfiguration` call.
- Verify: read `.tmp/data.db` `strapi_core_store_settings` and assert every `layouts.edit` row has length 1 and `size === 12`.

## Validation

Run after scaffolding:
1. **JSON parses:** `node -e "JSON.parse(require('fs').readFileSync('<f>','utf8'))"` over every new `.json`.
2. **Regenerate types + validate schemas load:** `npx strapi ts:generate-types`. This rewrites `types/generated/*.d.ts` and reports 0 errors only if all schemas/components are structurally valid. **Required** — until types regenerate, the factory UID literals (`'api::x.x'`) fail `tsc` with `TS2345 "not assignable to ContentType"`. That error is expected pre-regen, not a real bug.
3. **Typecheck:** `npx tsc --noEmit -p tsconfig.json` → expect 0 errors (`strict:false`, so untyped lifecycle `event` params are fine).
4. **Boot test (optional, strong):** confirm `DATABASE_CLIENT=sqlite` in `.env` first so you write to local `.tmp/data.db`, **not** the Railway Postgres in `DATABASE_URL`. Then `printf '.exit\n' | PORT=<free> npx strapi console` (a dev server may hold 1337; pick a free port). `strapi console` runs register+bootstrap without the slow admin build. macOS has **no `timeout`** command. Exit 0 + no `[labels]` warnings = all UIDs resolved.
5. **Verify persisted labels:** read `.tmp/data.db` `strapi_core_store_settings` for keys `plugin_content_manager_configuration_content_types::<uid>` / `...components::<uid>` and check `metadatas.<field>.edit.label`.

## Decisions to confirm with the user before scaffolding
- **Inheritance** (`extends`): base-component approach vs one collection + type enum.
- **Mixed-media blocks** ("images XOR video"): split into separate block types, or one block with both optional fields (no hard enforcement — note it).
- **Auto-generation** of display names: which fields, derived from what. Fields with no source (e.g. a bare gallery) stay manual.
- **Relation cardinalities** (which side owns, reuse vs ownership).
- **i18n scope** + draft/publish.
- **Display-name wording** only if ambiguous — keys are always camelCase and labels are always seeded (not up for debate); confirm just the label text when the field name doesn't read well as prose.
