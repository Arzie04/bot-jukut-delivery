import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import CommandHandlers from './handlers/commandHandlers';
import CallbackHandlers from './handlers/callbackHandlers';
import OrderNotifierService from './services/orderNotifier';
import StatusSchedulerService from './services/statusScheduler';

// Initialize bot
const bot = new TelegramBot(config.botToken, { 
  polling: {
    interval: config.polling.interval,
    autoStart: true,
    params: {
      timeout: config.polling.timeout,
    },
  },
});

console.log('🤖 Bot driver Jukut starting...');

// Set up a unified message handler to route all commands and text
bot.on('message', (msg) => {
  const text = msg.text;
  if (!text) return;

  // If the message is not a command, pass it to the text message handler (for registration)
  if (!text.startsWith('/')) {
    CommandHandlers.handleTextMessage(bot, msg);
    return;
  }

  // Parse command and arguments
  const [command, ...args] = text.split(' ');
  const messageText = args.join(' ');

  switch (command) {
    // General Commands
    case '/start':
      CommandHandlers.handleStart(bot, msg);
      break;
    case '/regist_driver':
      CommandHandlers.handleRegistDriver(bot, msg);
      break;
    case '/status':
      CommandHandlers.handleStatus(bot, msg);
      break;
    case '/standby':
      CommandHandlers.handleStandby(bot, msg);
      break;
    case '/off':
      CommandHandlers.handleOff(bot, msg);
      break;
    case '/active_orders':
      CommandHandlers.handleActiveOrders(bot, msg);
      break;

    // Admin Commands
    case '/off_all_driver':
      CommandHandlers.handleOffAllDriver(bot, msg);
      break;
    case '/listorder':
      CommandHandlers.handleListOrder(bot, msg);
      break;
    case '/cekpenghasilan':
      CommandHandlers.handleCekPenghasilan(bot, msg);
      break;
    case '/bc':
      CommandHandlers.handleBroadcast(bot, msg, messageText);
      break;
    case '/bc-standby':
      CommandHandlers.handleBroadcastStandby(bot, msg, messageText);
      break;
    case '/bc-off':
      CommandHandlers.handleBroadcastOff(bot, msg, messageText);
      break;

    // Fallback for unknown commands
    default:
      bot.sendMessage(msg.chat.id, '🤔 Perintah tidak dikenali.\n\nSilakan gunakan tombol menu yang tersedia atau ketik /start untuk memulai.');
      break;
  }
});

// Handle callback queries (inline keyboard button clicks)
bot.on('callback_query', (query) => {
  CallbackHandlers.handleCallbackQuery(bot, query);
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Handle webhook errors
bot.on('webhook_error', (error) => {
  console.error('❌ Webhook error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  OrderNotifierService.stop();
  StatusSchedulerService.stop();
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  OrderNotifierService.stop();
  StatusSchedulerService.stop();
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Bot driver Jukut is running!');
console.log('📱 Listening for messages...');
OrderNotifierService.start(bot);
StatusSchedulerService.start(bot);