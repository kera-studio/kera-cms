"use strict";

/**
 * Studio-key refactor (kera-web ADR 0004): the frontend repo is the source of
 * truth for studio identifiers, so the Clubspire `branch` enums must mirror
 * its keys. Runs before Strapi syncs content-type schemas, so it can rewrite
 * the old values while the old columns still exist.
 *
 * - customers.branch / payment_infos.branch: BRNO -> brno-stankova,
 *   PRAHA -> praha-veletrzni (kera-mini deliberately excluded — no Clubspire
 *   tenant yet).
 * - auth_tokens: purged (kera-web #225 replaces entity_id with email+branch;
 *   rows are one-shot pre-production tokens, dead either way).
 */

const BRANCH_RENAMES = {
  BRNO: "brno-stankova",
  PRAHA: "praha-veletrzni",
};

const BRANCH_TABLES = ["customers", "payment_infos"];

module.exports = {
  async up(knex) {
    for (const table of BRANCH_TABLES) {
      if (!(await knex.schema.hasTable(table))) continue;
      for (const [from, to] of Object.entries(BRANCH_RENAMES)) {
        const updated = await knex(table)
          .where("branch", from)
          .update({ branch: to });
        console.log(
          `[rename-clubspire-branch-keys] ${table}: ${from} -> ${to} (${updated} rows)`,
        );
      }
    }

    if (await knex.schema.hasTable("auth_tokens")) {
      const deleted = await knex("auth_tokens").del();
      console.log(
        `[rename-clubspire-branch-keys] auth_tokens: purged ${deleted} rows`,
      );
    }
  },
};
