import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import { config } from './config.js';
import { fetchTiaPrice } from './data.js';

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

  client.login(config.discordToken);
}

async function updateNickname(client, rate) {
  if (!rate) return;

  const nickname = `TIA/USD: ${rate}`;

  // Обновляем никнейм на всех серверах
  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.members.me.setNickname(nickname.slice(0, 32)); // Ограничиваем до 32 символов
      console.log(`Updated nickname in ${guild.name} to ${nickname}`);
    } catch (error) {
      console.error(`Error updating nickname in ${guild.name}: ${error.message}`);
    }
  }
}

function startNicknameUpdate(client) {
  // Планируем задачу каждые 10 минут
  cron.schedule(config.updateInterval, async () => {
    console.log('Fetching currency rate...');
    const rate = await fetchTiaPrice();
    console.log(rate);
    if (rate) {
      await updateNickname(client, rate);
    }
  });

  // Выполняем обновление сразу при старте
  fetchTiaPrice().then((rate) => updateNickname(client, rate));
}