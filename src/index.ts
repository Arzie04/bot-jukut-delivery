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

// Set up command handlers
bot.onText(/^\/start$/, (msg) => CommandHandlers.handleStart(bot, msg));
bot.onText(/^\/regist_driver$/, (msg) => CommandHandlers.handleRegistDriver(bot, msg));
bot.onText(/^\/status$/, (msg) => CommandHandlers.handleStatus(bot, msg));
bot.onText(/^\/standby$/, (msg) => CommandHandlers.handleStandby(bot, msg));
bot.onText(/^\/off$/, (msg) => CommandHandlers.handleOff(bot, msg));
bot.onText(/^\/active_orders$/, (msg) => CommandHandlers.handleActiveOrders(bot, msg));

// Admin commands
bot.onText(/^\/off_all_driver$/, (msg) => CommandHandlers.handleOffAllDriver(bot, msg));
bot.onText(/^\/listorder$/, (msg) => CommandHandlers.handleListOrder(bot, msg));
bot.onText(/^\/cekpenghasilan$/, (msg) => CommandHandlers.handleCekPenghasilan(bot, msg));
bot.onText(/^\/bc (.+)/, (msg, match) => CommandHandlers.handleBroadcast(bot, msg, match));
bot.onText(/^\/bc-standby (.+)/, (msg, match) => CommandHandlers.handleBroadcastStandby(bot, msg, match));
bot.onText(/^\/bc-off (.+)/, (msg, match) => CommandHandlers.handleBroadcastOff(bot, msg, match));

// Fallback for unknown commands
bot.on('message', (msg) => {
  if (msg.text?.startsWith('/')) {
    // This is a command, but it was not caught by any of the specific handlers above.
    bot.sendMessage(msg.chat.id, '🤔 Perintah tidak dikenali.\n\nSilakan gunakan tombol menu yang tersedia atau ketik /start untuk memulai.');
    return;
  }
  
  // If it's not a command, process it as a potential registration message.
  CommandHandlers.handleTextMessage(bot, msg);
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