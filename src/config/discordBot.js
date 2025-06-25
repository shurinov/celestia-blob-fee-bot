import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discordTokenBlobFee: process.env.DISCORD_TOKEN_BFEE,
  discordTokenBlobSize: process.env.DISCORD_TOKEN_BSIZE,
  updateInterval: '0 */10 * * * *', // Каждые 10 минут (cron)
};