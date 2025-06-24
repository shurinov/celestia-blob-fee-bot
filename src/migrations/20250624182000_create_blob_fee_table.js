export async function up(knex) {
  await knex.schema.createTable('blob_fee', (table) => {
    table.string('tx_hash', 64).notNullable().unique();
    table.string('signer', 62).notNullable();
    table.integer('height').notNullable();
    table.integer('size').notNullable();
    table.integer('fee').notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('blob_fee');
}


