
export async function up(knex) {
  await knex.schema.createTable('namespace_activity', (table) => {
    table.increments('id').primary();
    table.string('tx_hash', 64).notNullable();
    table.binary('namespace', 10).notNullable();
    
    table.unique(['tx_hash', 'namespace'], {
      indexName: 'uq_namespace_activity_tx_hash_namespace'
    });

    // fast search/filter by transaction
    table.index('tx_hash', 'idx_namespace_activity_tx_hash');
    table.index('namespace', 'idx_namespace_activity_namespace');
  });

  // Добавляем внешний ключ (рекомендуется для целостности)
  await knex.schema.table('namespace_activity', (table) => {
    table
      .foreign('tx_hash', 'fk_namespace_activity_tx_hash')
      .references('tx_hash')
      .inTable('blob_fee')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });

  await knex.schema.table('blob_fee', (table) => {
    table.index(['timestamp', 'tx_hash'], 'idx_blob_fee_timestamp_tx_hash');
  });
}

export async function down(knex) {
  await knex.schema.table('namespace_activity', (table) => {
    table.dropForeign('tx_hash', 'fk_namespace_activity_tx_hash');
  });

  await knex.schema.dropTableIfExists('namespace_activity');
  
  await knex.schema.table('blob_fee', (table) => {
    table.dropIndex(['timestamp', 'tx_hash'], 'idx_blob_fee_timestamp_tx_hash');
  });
}