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
  const { data } = event.params;

  // On update, product/location may be absent (unchanged) — leave the name as is.
  const productId = resolveProductId(data?.product);
  if (!productId || !data?.location) return;

  const product = await strapi.db
    .query("api::product.product")
    .findOne({ where: { id: productId }, select: ["title"] });

  const title = product?.title ?? "";
  data.internalDisplayName = [title, data.location].filter(Boolean).join(" – ");
}

export default {
  async beforeCreate(event) {
    await setInternalDisplayName(event);
  },
  async beforeUpdate(event) {
    await setInternalDisplayName(event);
  },
};
