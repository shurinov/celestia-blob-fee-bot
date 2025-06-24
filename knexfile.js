import dotenv from 'dotenv';

dotenv.config();

export default {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'your_username',
      password: process.env.DB_PASSWORD || 'your_password',
      database: process.env.DB_NAME || 'celestia_blob_fee_db',
    },
    migrations: {
      directory: './src/migrations',
    },
  },
};