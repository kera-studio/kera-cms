/**
 * premade-product lifecycles
 *
 * Auto-generates `internalDisplayName` as `${product.title} – ${location}`.
 * The product relation arrives in different shapes depending on the caller
 * (raw id, connect/set arrays, or an object), so we normalise it first.
 */

function resolveProductId(relation): number | string | null {
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

  let productId = resolveProductId(data?.product);
  let location = data?.location;

  // On update the admin only sends changed fields, so the unchanged half of the
  // name (product OR location) is absent. Backfill it from the existing row so
  // editing one field still rebuilds the full name instead of bailing out.
  if ((!productId || !location) && where?.id != null) {
    const existing = await strapi.db
      .query("api::premade-product.premade-product")
      .findOne({ where: { id: where.id }, populate: { product: true } });
    if (!productId) productId = existing?.product?.id ?? null;
    if (!location) location = existing?.location ?? null;
  }

  if (!productId || !location) return;

  const product = await strapi.db
    .query("api::product.product")
    .findOne({ where: { id: productId }, select: ["title"] });

  const title = product?.title ?? "";
  data.internalDisplayName = [title, location].filter(Boolean).join(" – ");
}

export default {
  async beforeCreate(event) {
    await setInternalDisplayName(event);
  },
  async beforeUpdate(event) {
    await setInternalDisplayName(event);
  },
};
