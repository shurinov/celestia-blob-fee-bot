
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

// Создание экземпляра клиента
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Событие готовности бота
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag} at ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' })}`);
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


export function startBot() {
  // Вход в систему с токеном
  client.login(process.env.DISCORD_TOKEN_BFEE);
}