export async function up(knex) {
  await knex.schema.alterTable('blob_fee', (table) => {
    table.timestamp('timestamp', { useTz: true }); // TIMESTAMPTZ, allow NULL
  });
  await knex.schema.table('blob_fee', function (table) {
    table.index('height', 'idx_blob_fee_height');
    table.index('timestamp', 'idx_blob_fee_timestamp');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('blob_fee', (table) => {
    table.dropColumn('timestamp');
  });
  await knex.schema.table('blob_fee', function (table) {
    table.dropIndex('height', 'idx_blob_fee_height');
    table.dropIndex('timestamp', 'idx_blob_fee_timestamp');
  });
}