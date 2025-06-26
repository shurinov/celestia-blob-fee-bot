import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import cron from 'node-cron';
import { config } from './config/discordBot.js';
import blobFeeService from './services/blobFeeService.js';



async function fetchNickname() {
  const totalFeeData = await blobFeeService.getTotalFee();
  //const totalFee = Number(totalFeeData.totalFee)/10**6;
  return blobFeeService.tiaAmountFormat(totalFeeData.totalFee);
}

async function fetchBlobSize() {
  const data = await blobFeeService.getTotalBlobSize();
  return blobFeeService.blobSizeFormat(data.totalBlobSize);
}

async function updateNickname(client, data) {
  if (!data) return;
  //const nickname = `TIA/USD: ${data}`;
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

export function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Регистрация слэш-команды
  // const commands = [
  //   new SlashCommandBuilder()
  //     .setName('info')
  //     .setDescription('Показать информацию о боте или сервере'),
  //   new SlashCommandBuilder()
  //     .setName('totalfee')
  //     .setDescription('Показать общий fee за blob-транзакции'),
  // ].map((command) => command.toJSON());



  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    // try {
    //   client.application.commands.set(commands);
    //   console.log('Slash commands registered');
    // } catch (error) {
    //   console.error('Error registering commands:', error);
    // }
    // Запускаем задачу обновления никнейма
    startNicknameUpdate(client);
  });

  // Обработка сообщений
  client.on('messageCreate', (message) => {
    // Игнорируем сообщения от ботов и из DM
    if (message.author.bot || !message.guild) return;
    
    // // Проверка команды !ping
    // if (message.content === '!ping') {
    //   // Отправляем ответ с задержкой
    //   message.reply(`Pong! Задержка: ${client.ws.ping}ms`);
    // }

    // Префикс команды
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    // Парсинг команды и аргументов
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Обработка команды !ping
    if (command === 'ping') {
      // Если нет аргументов, возвращаем базовый ответ
      if (!args.length) {
        message.reply(`Pong! Задержка: ${client.ws.ping}ms`);
        return;
      }

      // Обработка аргументов
      const arg = args[0].toLowerCase();

      if (arg === 'user') {
        // Пример: !ping user - отвечает с упоминанием пользователя
        message.reply(`Pong! Задержка: ${client.ws.ping}ms. Пользователь: ${message.author}`);
      } else if (!isNaN(arg)) {
        // Пример: !ping 100 - использует число как пользовательский параметр
        const customDelay = parseInt(arg);
        message.reply(`Pong! Задержка: ${client.ws.ping}ms. Пользовательская задержка: ${customDelay}ms`);
      } else {
        // Обработка неизвестного аргумента
        message.reply(`Pong! Задержка: ${client.ws.ping}ms. Неизвестный аргумент: ${arg}. Используйте !ping user или !ping <число>`);
      }
    }
  });

  // // Обработка команды /info
  // client.on('interactionCreate', async (interaction) => {
  //   if (!interaction.isCommand()) return;

  //   console.log("Integration");

  //   if (interaction.commandName === 'info') {
  //     try {
  //       const guild = interaction.guild;
  //       const botMember = guild.members.me;
  //       const totalFee = await blobFeeService.getTotalFee();

  //       const embed = new EmbedBuilder()
  //         .setTitle('Информация о боте')
  //         .setColor('#00FF00')
  //         .addFields(
  //           { name: 'Название бота', value: client.user.tag, inline: true },
  //           { name: 'Сервер', value: guild.name, inline: true },
  //           { name: 'Участников', value: guild.memberCount.toString(), inline: true },
  //           { name: 'Общий fee', value: totalFee.toString(), inline: true },
  //           { name: 'Время работы', value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`, inline: true }
  //         )
  //         .setTimestamp()
  //         .setFooter({ text: 'Celestia Blob Fee Bot', iconURL: client.user.displayAvatarURL() });

  //       await interaction.reply({ embeds: [embed] });
  //     } catch (error) {
  //       console.error('Error handling /info command:', error);
  //       await interaction.reply('Произошла ошибка при получении информации.');
  //     }
  //   }

  //   if (interaction.commandName === 'totalfee') {
  //     try {
  //       const { totalFee } = await blobFeeService.getTotalFee();
  //       await interaction.reply(`Total Blob Fee: ${totalFee}`);
  //     } catch (error) {
  //       await interaction.reply('Error fetching total fee');
  //       console.error(error);
  //     }
  //   }
  //});

  client.login(config.discordTokenBlobFee);
}
