// import type { Core } from '@strapi/strapi';

/**
 * Admin (Content-Manager) presentation: friendly field labels + full-width
 * edit layouts.
 *
 * Strapi has no per-field `label` in schema.json — the admin derives labels
 * from the attribute key. These maps seed nicer English labels, and every
 * edit form is forced to one field per row at full width (no columns), into
 * the Content-Manager configuration (stored in the DB) on every boot.
 *
 * Notes:
 *  - API field keys are unchanged; this only affects what editors see.
 *  - Re-applied on each restart, so edit it here (not in the admin "Configure
 *    the view", which would be overwritten on next boot).
 */
const CONTENT_TYPE_LABELS: Record<string, Record<string, string>> = {
  "api::product.product": {
    title: "Title",
    slug: "URL slug",
    coverPhoto: "Cover photo",
    premadeProducts: "Premade product instances",
  },
  "api::premade-product.premade-product": {
    internalDisplayName: "Internal label",
    product: "Product",
    price: "Price",
    stockCount: "Stock (units)",
    studio: "Studio",
  },
  "api::client-quote.client-quote": {
    name: "Client name",
    quote: "Quote",
  },
  "api::gallery.gallery": {
    internalDisplayName: "Internal label",
    images: "Images",
  },
  "api::group-activity.group-activity": {
    title: "Title",
    slug: "URL slug",
    base: "Activity details",
    content: "Page content",
    branches: "Restrict workshop to places",
    occasions: "Occasions",
  },
  "api::group-activity-occasion.group-activity-occasion": {
    title: "Title",
    slug: "URL slug",
    perex: "Perex",
    price: "Price",
    groupActivities: "Group activities",
  },
  "api::workshop-activity.workshop-activity": {
    title: "Title",
    slug: "URL slug",
    base: "Activity details",
    content: "Page content",
    bookingMode: "Booking mode",
    dates: "Scheduled dates",
    studio: "Studio",
  },
  "api::selfservice-activity.selfservice-activity": {
    title: "Title",
    slug: "URL slug",
    base: "Activity details",
    content: "Page content",
    withPremadeProducts: "Backed by premade products",
    studio: "Studio",
  },
  "api::studio.studio": {
    title: "Title",
    subtitle: "Subtitle",
    branch: "Studio branch",
    leader: "Studio leader",
    employees: "Employees",
    address: "Address",
    studioOpeningHours: "Studio opening hours",
    customerSupportOpeningHours: "Customer support hours",
    order: "Sort order",
  },
  "api::venue.venue": {
    title: "Title",
    subtitle: "Subtitle",
    leader: "Venue leader",
    address: "Address",
    openingHours: "Opening hours",
    customerSupportOpeningHours: "Customer support hours",
    order: "Sort order",
  },
  // No custom labels — empty map still routes the type through the seed loop so
  // its edit form gets the full-width (one-field-per-row) layout.
  "api::employee.employee": {},
  "api::documentation.documentation": {
    title: "Title",
    slug: "URL slug",
    parentDocumentation: "Parent",
    children: "Children",
    priority: "Priority",
    content: "Page content",
  },
  "api::faq.faq": {
    title: "Title",
    identifier: "ID",
    faqs: "Questions",
  },
  "api::project.project": {
    title: "Title",
    slug: "URL slug",
    cover: "Cover image",
    description: "Short description",
    content: "Page content",
    table: "Spec table",
    quote: "Client quote",
  },
  "api::magazine.magazine": {
    title: "Title",
    slug: "URL slug",
    perex: "Perex",
    cover: "Cover image",
    author: "Author",
    content: "Page content",
    eventUrl: "Event URL",
    table: "Spec table",
    tags: "Tags",
  },
  "api::magazine-tag.magazine-tag": {
    title: "Title",
    slug: "URL slug",
    magazines: "Magazine entries",
  },
};

const COMPONENT_LABELS: Record<string, Record<string, string>> = {
  "shared.price": {
    prefix: "Prefix",
    amount: "Amount (CZK)",
    currency: "Currency",
    withVat: "Includes VAT",
    suffix: "Suffix",
  },
  "shared.table-row": {
    header: "Label",
    body: "Value",
    note: "Note",
  },
  "shared.usp": {
    icon: "Icon",
    text: "Text",
  },
  "shared.list-item": {
    value: "Text",
  },
  "shared.event-date": {
    date: "Date & time",
    label: "Label",
  },
  "content.richtext": {
    body: "Text",
  },
  "content.video": {
    videoId: "YouTube video ID",
    title: "Title (for reference)",
  },
  "content.media-row": {
    imageOne: "First image",
    imageTwo: "Second image",
  },
  "content.premade-products": {
    products: "Products",
  },
  "studio.address": {
    fullAddress: "Full address",
    street: "Street",
    city: "City",
    postalCode: "Postal code",
    lat: "Latitude",
    lng: "Longitude",
    note: "Note",
  },
  "studio.opening-hours": {
    days: "Per-day hours",
    asText: 'Summary text (all days, e.g. "Mo-Su: 8:00-17:00")',
  },
  "studio.opening-hours-day": {
    day: "Weekday (0 = Mon ... 6 = Sun)",
    times: "Open periods",
  },
  "shared.opening-hours-interval": {
    startHour: "Opens at",
    endHour: "Closes at",
  },
  "content.faq-item": {
    title: "Question",
    answer: "Answer",
  },
  "activity.base": {
    cover: "Cover image",
    description: "Short description",
    table: "Spec table",
    price: "Price",
    additionalInfo: "Additional info",
    membership: "Membership type",
    usps: "Selling points",
    quote: "Client quote",
    gallery: "Gallery",
    lectors: "Lectors",
  },
};

/**
 * Entry title (`mainField`): the attribute used to label an entry in the admin
 * and, crucially, in relation pickers on other content types. Without this it
 * defaults to `documentId`, so a relation to one of these types renders as an
 * opaque hash. Point it at the human-readable (lifecycle-generated) label.
 */
const MAIN_FIELDS: Record<string, string> = {
  "api::premade-product.premade-product": "internalDisplayName",
  "api::gallery.gallery": "internalDisplayName",
  // Tree relation pickers (Parent/Children) show the title, not the documentId.
  "api::documentation.documentation": "title",
  "api::faq.faq": "title",
  // Quote relation pickers show the client name, not the documentId.
  "api::client-quote.client-quote": "name",
  // Tag and author relation pickers show the title/name, not the documentId.
  "api::magazine-tag.magazine-tag": "title",
  "api::magazine.magazine": "title",
  // Occasion relation pickers show the title, not the documentId.
  "api::group-activity-occasion.group-activity-occasion": "title",
};

/**
 * Component entry title (`mainField`): the field shown on each collapsed entry
 * of a repeatable component. Without it the accordion header is blank. Only one
 * field can be shown, so point it at the most identifying scalar (e.g. the
 * weekday number on an opening-hours day).
 */
const COMPONENT_MAIN_FIELDS: Record<string, string> = {
  "studio.opening-hours-day": "day",
  // Accordion header for each repeatable FAQ entry shows the question.
  "content.faq-item": "title",
};

/**
 * Per-relation entry title: a relation field stores its OWN `edit.mainField`,
 * captured when the field was first configured. Setting the target type's
 * `mainField` (above) only changes the default for new relations — existing
 * relation fields keep their stored value (often the `documentId` fallback,
 * which renders as a hash). Keyed by the content type / component that OWNS the
 * relation, then by field name, with the target attribute to display.
 */
const RELATION_MAIN_FIELDS: Record<string, Record<string, string>> = {
  "content.premade-products": { products: "internalDisplayName" },
  "api::product.product": { premadeProducts: "internalDisplayName" },
  "api::documentation.documentation": {
    parentDocumentation: "title",
    children: "title",
  },
  "api::project.project": { quote: "name" },
  "api::magazine.magazine": { author: "team_member_name", tags: "title" },
  "api::group-activity-occasion.group-activity-occasion": {
    groupActivities: "title",
  },
  "api::group-activity.group-activity": { occasions: "title" },
};

/**
 * Lifecycle-generated fields: shown read-only in the admin with a note, so
 * editors don't try to set them (and don't see a misleading live preview —
 * e.g. a `uid` with targetField would otherwise show a title-only slug).
 */
const READONLY_FIELDS: Record<string, Record<string, string>> = {
  "api::premade-product.premade-product": {
    internalDisplayName: "Generated from product + studio on save.",
  },
  "api::workshop-activity.workshop-activity": {
    slug: "Generated from title + studio on save.",
  },
  "api::selfservice-activity.selfservice-activity": {
    slug: "Generated from title + studio on save.",
  },
};

/**
 * Editable fields that get an explanatory note under the input in the admin.
 * Unlike READONLY_FIELDS this leaves the field editable — it only attaches a
 * `description`. Keyed by content type / component, then by field name.
 */
const FIELD_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "api::workshop-activity.workshop-activity": {
    bookingMode:
      'How visitors book this activity. "Calendar" shows the reservation calendar. "Inquiry" hides the calendar and shows a contact/CTA form instead.',
  },
};

/** Patch a Content-Manager configuration's metadata labels in place. */
function applyLabels(config, labels: Record<string, string>): boolean {
  let changed = false;
  for (const [field, label] of Object.entries(labels)) {
    const meta = config?.metadatas?.[field];
    if (!meta) continue;
    meta.edit = { ...(meta.edit ?? {}), label };
    if (meta.list) meta.list = { ...meta.list, label };
    changed = true;
  }
  return changed;
}

/** Mark fields as non-editable in the admin and attach an explanatory note. */
function applyReadonly(config, fields: Record<string, string>): boolean {
  let changed = false;
  for (const [field, description] of Object.entries(fields)) {
    const meta = config?.metadatas?.[field];
    if (!meta) continue;
    meta.edit = { ...(meta.edit ?? {}), editable: false, description };
    changed = true;
  }
  return changed;
}

/** Attach an explanatory note to editable fields (leaves `editable` alone). */
function applyDescriptions(config, fields: Record<string, string>): boolean {
  let changed = false;
  for (const [field, description] of Object.entries(fields)) {
    const meta = config?.metadatas?.[field];
    if (!meta) continue;
    meta.edit = { ...(meta.edit ?? {}), description };
    changed = true;
  }
  return changed;
}

/** Set the entry title (`mainField`) used in lists and relation pickers. */
function applyMainField(config, mainField: string): boolean {
  if (!mainField || config?.settings?.mainField === mainField) return false;
  config.settings = { ...(config.settings ?? {}), mainField };
  return true;
}

/** Set the attribute each relation field uses to label its related entries. */
function applyRelationMainFields(
  config,
  fields: Record<string, string>,
): boolean {
  let changed = false;
  for (const [field, mainField] of Object.entries(fields)) {
    const meta = config?.metadatas?.[field];
    if (!meta || meta.edit?.mainField === mainField) continue;
    meta.edit = { ...(meta.edit ?? {}), mainField };
    changed = true;
  }
  return changed;
}

/**
 * Force the edit form to one field per row, each full width (size 12) — no
 * side-by-side columns. Valid for every field type: component/dynamiczone/
 * json/richtext/blocks are locked to 12, and all resizable types allow 12.
 */
function makeFullWidth(config): boolean {
  const edit = config?.layouts?.edit;
  if (!Array.isArray(edit) || edit.length === 0) return false;
  const flat = edit.flat().filter((el) => el && el.name);
  config.layouts.edit = flat.map((el) => [{ ...el, size: 12 }]);
  return true;
}

async function seedAdminConfig(strapi) {
  const ctService = strapi.plugin("content-manager").service("content-types");
  for (const [uid, labels] of Object.entries(CONTENT_TYPE_LABELS)) {
    const contentType = strapi.contentType(uid);
    if (!contentType) {
      strapi.log.warn(`[admin-config] content type not found: ${uid}`);
      continue;
    }
    const config = await ctService.findConfiguration(contentType);
    const changed = [
      applyLabels(config, labels),
      applyReadonly(config, READONLY_FIELDS[uid] ?? {}),
      applyDescriptions(config, FIELD_DESCRIPTIONS[uid] ?? {}),
      applyMainField(config, MAIN_FIELDS[uid]),
      applyRelationMainFields(config, RELATION_MAIN_FIELDS[uid] ?? {}),
      makeFullWidth(config),
    ].some(Boolean);
    if (changed) {
      await ctService.updateConfiguration(contentType, config);
    }
  }

  const compService = strapi.plugin("content-manager").service("components");
  for (const [uid, labels] of Object.entries(COMPONENT_LABELS)) {
    const component = strapi.components[uid];
    if (!component) {
      strapi.log.warn(`[admin-config] component not found: ${uid}`);
      continue;
    }
    const config = await compService.findConfiguration(component);
    const changed = [
      applyLabels(config, labels),
      applyMainField(config, COMPONENT_MAIN_FIELDS[uid]),
      applyRelationMainFields(config, RELATION_MAIN_FIELDS[uid] ?? {}),
      makeFullWidth(config),
    ].some(Boolean);
    if (changed) {
      await compService.updateConfiguration(component, config);
    }
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    await seedAdminConfig(strapi);
  },
};
