import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  coingeckoApiKey: process.env.COINGECKO_API_KEY,
  updateInterval: '0 */10 * * * *', // Каждые 10 минут (cron)
  nodeApiUrl: process.env.TIA_API_URL
};