/**
 * premade-product lifecycles
 *
 * Auto-generates `internalDisplayName` as `${product.title} – ${studio.title}`.
 * Both relations arrive in different shapes depending on the caller
 * (raw id, connect/set arrays, or an object), so we normalise them first.
 */

function resolveRelationId(relation): number | string | null {
  if (relation == null) return null;
  if (typeof relation === "number" || typeof relation === "string")
    return relation;
  if (Array.isArray(relation)) {
    const first = relation[0];
    return first?.id ?? first ?? null;
  }
  if (Array.isArray(relation.connect) && relation.connect.length) {
    return relation.connect[0]?.id ?? relation.connect[0] ?? null;
  }
  if (Array.isArray(relation.set) && relation.set.length) {
    return relation.set[0]?.id ?? relation.set[0] ?? null;
  }
  return relation.id ?? null;
}

async function setInternalDisplayName(event) {
  const { data, where } = event.params;

  let productId = resolveRelationId(data?.product);
  let studioId = resolveRelationId(data?.studio);

  // On update the admin only sends changed fields, so the unchanged half of the
  // name (product OR studio) is absent. Backfill it from the existing row so
  // editing one field still rebuilds the full name instead of bailing out.
  if ((!productId || !studioId) && where?.id != null) {
    const existing = await strapi.db
      .query("api::premade-product.premade-product")
      .findOne({
        where: { id: where.id },
        populate: { product: true, studio: true },
      });
    if (!productId) productId = existing?.product?.id ?? null;
    if (!studioId) studioId = existing?.studio?.id ?? null;
  }

  if (!productId || !studioId) return;

  const product = await strapi.db
    .query("api::product.product")
    .findOne({ where: { id: productId }, select: ["title"] });
  const studio = await strapi.db
    .query("api::studio.studio")
    .findOne({ where: { id: studioId }, select: ["title"] });

  const title = product?.title ?? "";
  const studioTitle = studio?.title ?? "";
  data.internalDisplayName = [title, studioTitle].filter(Boolean).join(" – ");
}

export default {
  async beforeCreate(event) {
    await setInternalDisplayName(event);
  },
  async beforeUpdate(event) {
    await setInternalDisplayName(event);
  },
};
