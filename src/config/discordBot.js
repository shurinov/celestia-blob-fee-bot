import dotenv from 'dotenv';

dotenv.config();


const TARGET_CHANNEL_IDS = (process.env.DISCORD_TARGET_CHANNEL_IDS).split(',');


export const config = {
  discordTokenBlobFee: process.env.DISCORD_TOKEN_BFEE,
  discordTokenBlobSize: process.env.DISCORD_TOKEN_BSIZE,
  discordTargetChannelIds: TARGET_CHANNEL_IDS,
  updateInterval: '0 */10 * * * *', // Каждые 10 минут (cron)
};