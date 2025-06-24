import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Подключаемся к системной базе postgres
  });

  try {
    await client.connect();
    await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`Database ${process.env.DB_NAME} already exists`);
    } else {
      console.error('Error creating database:', error.message);
    }
  } finally {
    await client.end();
  }
}

createDatabase();