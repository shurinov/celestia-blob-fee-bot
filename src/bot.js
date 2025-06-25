import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import { config } from './config.js';
// import { fetchTiaPrice } from './data.js';
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

  client.login(config.discordToken);
}

function customFixed(value, deci=3){
  return Math.floor(value*10**deci)/10**deci;
}

function tiaAmountFormat(amount){
  const amountTia = amount/10**6;
  if (amountTia < 1) return amountTia;
  if (amountTia < 10) return customFixed(amountTia, 3);
  if (amountTia < 100) return customFixed(amountTia, 2);
  if (amountTia < 1000) return customFixed(amountTia, 1);
  if (amountTia < 10000) return customFixed(amountTia/1000, 3)+'k';
  if (amountTia < 100000) return customFixed(amountTia/1000, 2)+'k';
  if (amountTia < 1000000) return customFixed(amountTia/1000, 1)+'k';
  if (amountTia < 10000000) return customFixed(amountTia/10**6, 3)+'M';
  if (amountTia < 100000000) return customFixed(amountTia/10**6, 2)+'M';
  if (amountTia < 1000000000) return customFixed(amountTia/10**6, 1)+'M';
  if (amountTia < 10000000000) return customFixed(amountTia/10**9, 3)+'B';
  if (amountTia < 100000000000) return customFixed(amountTia/10**9, 2)+'B';
  if (amountTia < 1000000000000) return customFixed(amountTia/10**9, 1)+'B';
  return customFixed(amountTia/10**9, 0)+'B';
}

function blobSizeFormat(size){
  if (size < 1024) return size;
  if (size < 1024*1024) return customFixed(size/1024, 2)+'kB';
  if (size < 1024*1024*1024) return customFixed(size/1024/1024, 2) + 'MB';
  if (size < 1024*1024*1024*1024) return customFixed(size/1024/1024/1024, 2) + 'GB';
  if (size < 1024*1024*1024*1024*1024) return customFixed(size/1024/1024/1024/1024, 2) + 'TB';
  return customFixed(size/1024/1024/1024/1024/1024, 2) + 'PB';
}

async function fetchNickname() {
  const totalFeeData = await blobFeeService.getTotalFee();
  //const totalFee = Number(totalFeeData.totalFee)/10**6;
  return tiaAmountFormat(totalFeeData.totalFee);
}

async function fetchBlobSize() {
  const data = await blobFeeService.getTotalBlobSize();
  return blobSizeFormat(data.totalBlobSize);
}


async function updateNickname(client, data) {
  if (!data) return;
  //const nickname = `TIA/USD: ${data}`;
  const nickname = `BlobFee: ${data} TIA`;

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
    const rate = await fetchNickname();
    console.log(rate);
    if (rate) {
      await updateNickname(client, rate);
    }
  });

  // Выполняем обновление сразу при старте
  fetchNickname().then((rate) => updateNickname(client, rate));
}