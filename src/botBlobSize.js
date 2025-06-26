import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import { config } from './config/discordBot.js';
import blobFeeService from './services/blobFeeService.js';


export function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    // Запускаем задачу обновления никнейма
    startNicknameUpdate(client);
  });

  client.login(config.discordTokenBlobSize);
}

async function fetchBlobSize() {
  const data = await blobFeeService.getTotalBlobSize();
  return blobFeeService.blobSizeFormat(data.totalBlobSize);
}

async function updateNickname(client, data) {
  if (!data) return;
  const nickname = `${data} total blobs`;

  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.members.me.setNickname(nickname.slice(0, 32));
      console.log(`Updated nickname in ${guild.name} to ${nickname}`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Задержка 1 сек
    } catch (error) {
      console.error(`Error in ${guild.name}: ${error.message}`);
    }
  }
}

function startNicknameUpdate(client) {
  // Планируем задачу каждые 10 минут
  cron.schedule(config.updateInterval, async () => {
    console.log('Fetching data...');
    const rate = await fetchBlobSize();
    console.log(rate);
    if (rate) {
      await updateNickname(client, rate);
    }
  });

  // Выполняем обновление сразу при старте
  fetchBlobSize().then((rate) => updateNickname(client, rate));
}