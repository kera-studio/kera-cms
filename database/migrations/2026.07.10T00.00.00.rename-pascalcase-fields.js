"use strict";

/**
 * PascalCase → camelCase attribute rename (schema files renamed in the same
 * commit). DB column and join-table names are derived via snakeCase(attr), so
 * they are identical for both spellings — the only places the attribute name
 * is stored VERBATIM as data are the component/dynamic-zone link tables
 * (`*_cmps.field`) and the media morph table (`files_related_mph.field`).
 * Runs before Strapi syncs content-type schemas; idempotent (re-run = 0 rows).
 */

const CMPS_FIELD_RENAMES = {
  documentations_cmps: { Content: "content" },
  faqs_cmps: { Faqs: "faqs" },
  projects_cmps: { Content: "content", Table: "table" },
  studios_cmps: {
    Address: "address",
    StudioOpeningHours: "studioOpeningHours",
    CustomerSupportOpeningHours: "customerSupportOpeningHours",
  },
  components_studio_opening_hours_cmps: { Days: "days" },
  components_studio_opening_hours_days_cmps: { Times: "times" },
};

const MEDIA_FIELD_RENAMES = [
  { relatedType: "api::employee.employee", from: "Avatar", to: "avatar" },
  { relatedType: "api::project.project", from: "Cover", to: "cover" },
];

module.exports = {
  async up(knex) {
    for (const [table, renames] of Object.entries(CMPS_FIELD_RENAMES)) {
      if (!(await knex.schema.hasTable(table))) continue;
      for (const [from, to] of Object.entries(renames)) {
        const updated = await knex(table)
          .where("field", from)
          .update({ field: to });
        console.log(
          `[rename-pascalcase-fields] ${table}: ${from} -> ${to} (${updated} rows)`,
        );
      }
    }

    if (await knex.schema.hasTable("files_related_mph")) {
      for (const { relatedType, from, to } of MEDIA_FIELD_RENAMES) {
        const updated = await knex("files_related_mph")
          .where({ related_type: relatedType, field: from })
          .update({ field: to });
        console.log(
          `[rename-pascalcase-fields] files_related_mph (${relatedType}): ${from} -> ${to} (${updated} rows)`,
        );
      }
    }
  },
};
