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
    startNicknameUpdate(client);
  });

  client.login(config.discordTokenBlobSize);
}

async function fetchData() {
  const data = await blobFeeService.getTotalBlobSize();
  const change24h = await blobFeeService.get24hBlobSize();
  const namespaces7d = await blobFeeService.getUniqueNamespaces(24*7);
  return {
    total: blobFeeService.blobSizeFormat(data.totalBlobSize),
    change24h: blobFeeService.blobSizeFormat(change24h.blobSize24h),
    namespaces7d: namespaces7d?.namespacesCnt,
  };
}



async function updateNickname(client, data, change, namespaces7d) {
  if (!data) return;
  //const nickname = `${data} `;
  const nickname = `${data} | +${change} | ${namespaces7d}`;
  const status = `Blobs size total | 24h change | 7-day unique namespaces activity`;

  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.members.me.setNickname(nickname.slice(0, 32));
      console.log(`Updated nickname in ${guild.name} to ${nickname}`);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error in ${guild.name}: ${error.message}`);
    }
  }

  // Update status globaly
  try {
    await client.user.setPresence({
      activities: [{
        name: status.slice(0, 128), // for compatibility
        state: status.slice(0, 128), // Custom
        type: 4, // Custom status
      }],
      status: 'online', // 'online', 'idle', 'dnd', 'invisible'
    });
  } catch (error) {
    console.error(`Error while update status: ${error.message}`);
  }
}

function startNicknameUpdate(client) {
  cron.schedule(config.updateInterval, async () => {
    console.log('Fetching data...');
    const rate = await fetchData();
    console.log(rate);
    if (rate) {
      await updateNickname(client, rate.total, rate.change24h, rate.namespaces7d);
    }
  });

  // update after start
  fetchData().then((rate) => updateNickname(client, rate.total, rate.change24h, rate.namespaces7d));
}