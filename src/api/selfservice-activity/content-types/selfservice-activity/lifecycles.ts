/**
 * selfservice-activity lifecycles
 *
 * Auto-generates `slug` from title + studio slug. The `uid` field can only
 * target a single attribute, so the combined slug is built here instead.
 */

const UID = 'api::selfservice-activity.selfservice-activity';

/** URL-safe slug; NFKD strips Czech diacritics (ž→z, ů→u, …). */
function slugify(input: string): string {
  return (input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Normalise a relation payload (raw id, array, connect/set, object) to an id. */
function resolveRelationId(relation): number | string | null {
  if (relation == null) return null;
  if (typeof relation === 'number' || typeof relation === 'string')
    return relation;
  if (Array.isArray(relation)) {
    const first = relation[0];
    return first?.id ?? first ?? null;
  }
  if (Array.isArray(relation.connect) && relation.connect.length)
    return relation.connect[0]?.id ?? relation.connect[0] ?? null;
  if (Array.isArray(relation.set) && relation.set.length)
    return relation.set[0]?.id ?? relation.set[0] ?? null;
  return relation.id ?? null;
}

async function setComputedFields(event) {
  const { data, where } = event.params;

  // title/studio may be absent on a partial update — fall back to the
  // stored entry so we can still build the combined slug.
  let title = data?.title;
  let studioId = resolveRelationId(data?.studio);
  if ((title === undefined || studioId == null) && where?.id) {
    const existing = await strapi.db.query(UID).findOne({
      where: { id: where.id },
      select: ['title'],
      populate: { studio: true },
    });
    title = title ?? existing?.title;
    if (studioId == null) studioId = existing?.studio?.id ?? null;
  }

  if (studioId == null) return;

  const studio = await strapi.db
    .query('api::studio.studio')
    .findOne({ where: { id: studioId }, select: ['slug'] });
  const studioSlug = studio?.slug;

  if (title && studioSlug) data.slug = `${slugify(title)}-${studioSlug}`;
}

export default {
  async beforeCreate(event) {
    await setComputedFields(event);
  },
  async beforeUpdate(event) {
    await setComputedFields(event);
  },
};
