"use strict";

/**
 * Studio lost its `slug` attribute in the branch-enum refactor (67c430b), so
 * the workshop-/selfservice-activity lifecycles silently stopped rebuilding
 * slugs (`studio?.slug` was always undefined) and existing rows kept the
 * stale `-studio-<branch>` suffix. The lifecycles now derive the suffix from
 * `studios.branch`; this rebuilds every stored slug to the new format
 * (`<slugified title>-<branch>`). Idempotent — rewriting yields the same
 * value. Rows without a linked studio are left untouched.
 */

const TABLES = [
  {
    table: "workshop_activities",
    link: "workshop_activities_studio_lnk",
    fk: "workshop_activity_id",
  },
  {
    table: "selfservice_activities",
    link: "selfservice_activities_studio_lnk",
    fk: "selfservice_activity_id",
  },
];

/** Mirrors slugify() in the activity lifecycles. */
function slugify(input) {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = {
  async up(knex) {
    for (const { table, link, fk } of TABLES) {
      if (!(await knex.schema.hasTable(table))) continue;
      const rows = await knex(table)
        .join(link, `${link}.${fk}`, `${table}.id`)
        .join("studios", "studios.id", `${link}.studio_id`)
        .select(`${table}.id`, `${table}.title`, `${table}.slug`, "studios.branch");
      let updated = 0;
      for (const row of rows) {
        if (!row.title || !row.branch) continue;
        const slug = `${slugify(row.title)}-${row.branch}`;
        if (slug === row.slug) continue;
        await knex(table).where("id", row.id).update({ slug });
        updated += 1;
      }
      console.log(
        `[rebuild-activity-slugs] ${table}: ${updated}/${rows.length} slugs rebuilt`,
      );
    }
  },
};
