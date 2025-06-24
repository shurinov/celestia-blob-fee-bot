export async function up(knex) {
  await knex.schema.createTable('blob_fee', (table) => {
    table.string('tx_hash', 64).notNullable().unique(); // VARCHAR(64), уникальный
    table.integer('height').notNullable(); // INT
    table.integer('size').notNullable(); // INT
    table.integer('fee').notNullable(); // INT
    // table.index(['height'], 'idx_blob_fee_height'); // Индекс для оптимизации запросов по height
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('blob_fee');
}


