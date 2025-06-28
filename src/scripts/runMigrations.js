import knex from 'knex';
import config from '../../knexfile.js';
import { createDatabase } from './createDatabase.js';


export async function runMigrations() {
  try {
    await createDatabase();

    // Knex init
    const knexInstance = knex(config.development);

    // Run migrations
    await knexInstance.migrate.latest();
    console.log('Migrations applied successfully');

    // Close connection
    await knexInstance.destroy();
  } catch (error) {
    console.error('Error running migrations:', error.message);
    throw error;
  }
}

export default runMigrations;