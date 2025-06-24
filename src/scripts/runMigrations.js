import knex from 'knex';
import config from '../../knexfile.js';
import { createDatabase } from './createDatabase.js';


export async function runMigrations() {
  try {
    // Сначала создаем базу данных
    await createDatabase();

    // Инициализируем Knex с конфигурацией
    const knexInstance = knex(config.development);

    // Выполняем миграции
    await knexInstance.migrate.latest();
    console.log('Migrations applied successfully');

    // Закрываем соединение
    await knexInstance.destroy();
  } catch (error) {
    console.error('Error running migrations:', error.message);
    throw error;
  }
}

export default runMigrations;