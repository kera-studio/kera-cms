/**
 * workshop-activity lifecycles
 *
 * Auto-generates `slug` from title + location. The `uid` field can only
 * target a single attribute, so the combined slug is built here instead.
 */

const UID = 'api::workshop-activity.workshop-activity';

/** URL-safe slug; NFKD strips Czech diacritics (ž→z, ů→u, …). */
function slugify(input: string): string {
  return (input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function setComputedFields(event) {
  const { data, where } = event.params;

  // title/location may be absent on a partial update — fall back to the
  // stored entry so we can still build the combined slug.
  let title = data?.title;
  let location = data?.location;
  if ((title === undefined || location === undefined) && where?.id) {
    const existing = await strapi.db
      .query(UID)
      .findOne({ where: { id: where.id }, select: ['title', 'location'] });
    title = title ?? existing?.title;
    location = location ?? existing?.location;
  }

  if (title && location) data.slug = `${slugify(title)}-${location}`;
}

export default {
  async beforeCreate(event) {
    await setComputedFields(event);
  },
  async beforeUpdate(event) {
    await setComputedFields(event);
  },
};
