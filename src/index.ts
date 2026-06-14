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
  'api::product.product': {
    title: 'Title',
    slug: 'URL slug',
    coverPhoto: 'Cover photo',
    premadeProducts: 'Premade product instances',
  },
  'api::premade-product.premade-product': {
    internalDisplayName: 'Internal label',
    product: 'Product',
    price: 'Price',
    stockCount: 'Stock (units)',
    location: 'Studio location',
  },
  'api::client-quote.client-quote': {
    name: 'Client name',
    quote: 'Quote',
  },
  'api::gallery.gallery': {
    internalDisplayName: 'Internal label',
    images: 'Images',
  },
  'api::group-activity-lesson.group-activity-lesson': {
    title: 'Title',
    slug: 'URL slug',
    coverPhoto: 'Cover photo',
    description: 'Description',
    details: 'Details',
    price: 'Price',
  },
  'api::group-activity.group-activity': {
    title: 'Title',
    slug: 'URL slug',
    base: 'Activity details',
    content: 'Page content',
    groupActivityLessons: 'Lessons',
  },
  'api::workshop-activity.workshop-activity': {
    title: 'Title',
    slug: 'URL slug',
    base: 'Activity details',
    content: 'Page content',
    dates: 'Scheduled dates',
    location: 'Studio location',
  },
  'api::selfservice-activity.selfservice-activity': {
    title: 'Title',
    slug: 'URL slug',
    base: 'Activity details',
    content: 'Page content',
    withPremadeProducts: 'Backed by premade products',
    location: 'Studio location',
  },
};

const COMPONENT_LABELS: Record<string, Record<string, string>> = {
  'shared.price': {
    prefix: 'Prefix',
    amount: 'Amount (CZK)',
    currency: 'Currency',
    withVat: 'Includes VAT',
    suffix: 'Suffix',
  },
  'shared.table-row': {
    header: 'Label',
    body: 'Value',
    note: 'Note',
  },
  'shared.usp': {
    icon: 'Icon',
    text: 'Text',
  },
  'shared.list-item': {
    value: 'Text',
  },
  'shared.event-date': {
    date: 'Date & time',
    label: 'Label',
  },
  'content.richtext': {
    body: 'Text',
  },
  'content.video': {
    videoId: 'YouTube video ID',
    title: 'Title (for reference)',
  },
  'content.media-row': {
    imageOne: 'First image',
    imageTwo: 'Second image',
  },
  'content.premade-products': {
    products: 'Products',
  },
  'activity.base': {
    cover: 'Cover image',
    description: 'Short description',
    table: 'Spec table',
    price: 'Price',
    additionalInfo: 'Additional info',
    membership: 'Membership type',
    usps: 'Selling points',
    quote: 'Client quote',
    gallery: 'Gallery',
  },
};

/**
 * Entry title (`mainField`): the attribute used to label an entry in the admin
 * and, crucially, in relation pickers on other content types. Without this it
 * defaults to `documentId`, so a relation to one of these types renders as an
 * opaque hash. Point it at the human-readable (lifecycle-generated) label.
 */
const MAIN_FIELDS: Record<string, string> = {
  'api::premade-product.premade-product': 'internalDisplayName',
  'api::gallery.gallery': 'internalDisplayName',
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
  'content.premade-products': { products: 'internalDisplayName' },
  'api::product.product': { premadeProducts: 'internalDisplayName' },
};

/**
 * Lifecycle-generated fields: shown read-only in the admin with a note, so
 * editors don't try to set them (and don't see a misleading live preview —
 * e.g. a `uid` with targetField would otherwise show a title-only slug).
 */
const READONLY_FIELDS: Record<string, Record<string, string>> = {
  'api::premade-product.premade-product': {
    internalDisplayName: 'Generated from product + location on save.',
  },
  'api::workshop-activity.workshop-activity': {
    slug: 'Generated from title + location on save.',
  },
  'api::selfservice-activity.selfservice-activity': {
    slug: 'Generated from title + location on save.',
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

/** Set the entry title (`mainField`) used in lists and relation pickers. */
function applyMainField(config, mainField: string): boolean {
  if (!mainField || config?.settings?.mainField === mainField) return false;
  config.settings = { ...(config.settings ?? {}), mainField };
  return true;
}

/** Set the attribute each relation field uses to label its related entries. */
function applyRelationMainFields(config, fields: Record<string, string>): boolean {
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
  const ctService = strapi.plugin('content-manager').service('content-types');
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
      applyMainField(config, MAIN_FIELDS[uid]),
      applyRelationMainFields(config, RELATION_MAIN_FIELDS[uid] ?? {}),
      makeFullWidth(config),
    ].some(Boolean);
    if (changed) {
      await ctService.updateConfiguration(contentType, config);
    }
  }

  const compService = strapi.plugin('content-manager').service('components');
  for (const [uid, labels] of Object.entries(COMPONENT_LABELS)) {
    const component = strapi.components[uid];
    if (!component) {
      strapi.log.warn(`[admin-config] component not found: ${uid}`);
      continue;
    }
    const config = await compService.findConfiguration(component);
    const changed = [
      applyLabels(config, labels),
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
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

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
