import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import cron from 'node-cron';
import { config } from './config/discordBot.js';
import blobFeeService from './services/blobFeeService.js';


async function fetchBlobsFee() {
  const totalFeeData = await blobFeeService.getTotalFee();
  return blobFeeService.tiaAmountFormat(totalFeeData.totalFee);
}

async function fetchBlobsSize() {
  const data = await blobFeeService.getTotalBlobSize();
  return blobFeeService.blobSizeFormat(data.totalBlobSize);
}

async function fetchLatestHeightInDb() {
  const data = await blobFeeService.getMaxHeight();
  return data.maxHeight;
}


async function updateNickname(client, data) {
  if (!data) return;
  const nickname = `${data}TIA blobs Fee`;

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
  cron.schedule(config.updateInterval, async () => {
    console.log('Fetching data...');
    const rate = await fetchBlobsFee();
    console.log(rate);
    if (rate) {
      await updateNickname(client, rate);
    }
  });

  // update after start
  fetchBlobsFee().then((rate) => updateNickname(client, rate));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export function startBot() {
  client.login(config.discordTokenBlobFee);
}


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  startNicknameUpdate(client);
});


client.on('messageCreate', async (message) => {
  // ignore messages form bots and in DM
  if (message.author.bot || !message.guild) return;

  if (!config.discordTargetChannelIds.includes(message.channel.id)) return;

  
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  // command and args parsing
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !info command handling
  if (command === 'info') {
    //const totalFee = await fetchBlobsFee();
    const totalFeeData = await blobFeeService.getTotalFee();
    const totalFee = `${blobFeeService.tiaAmountFormat(totalFeeData.totalFee)}TIA  ( ${totalFeeData.totalFee/10**6} TIA )`;
    const data = await blobFeeService.getTotalBlobSize();
    const totalSize = `${blobFeeService.blobSizeFormat(data.totalBlobSize)} ( ${data.totalBlobSize} bit)`;
    const height = await fetchLatestHeightInDb();
    
    const embed = new EmbedBuilder()
      .setTitle('Celestia Blobs Info')
      .setColor('#00FF00')
      .addFields(
        { name: 'Total blobs size: ', value: totalSize.toString()},
        { name: 'Total payed blobs fee: ', value: totalFee},
        { name: 'Latest blob fee block height: ', value: height.toString()},
        // { name: 'Bot uptime', value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Celestia Blob Fee Bot', iconURL: client.user.displayAvatarURL() });

    message.reply({ embeds: [embed] });
  }
});

  

