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
bot.onText(/^\/start$/, (msg) => {
  CommandHandlers.handleStart(bot, msg);
});

bot.onText(/^\/regist_driver$/, (msg) => {
  CommandHandlers.handleRegistDriver(bot, msg);
});

bot.onText(/^\/status$/, (msg) => {
  CommandHandlers.handleStatus(bot, msg);
});

bot.onText(/^\/standby$/, (msg) => {
  CommandHandlers.handleStandby(bot, msg);
});

bot.onText(/^\/off$/, (msg) => {
  CommandHandlers.handleOff(bot, msg);
});

bot.onText(/^\/active_orders$/, (msg) => {
  CommandHandlers.handleActiveOrders(bot, msg);
});

bot.onText(/^\/off_all_driver$/, (msg) => {
  CommandHandlers.handleOffAllDriver(bot, msg);
});

// Handle text messages (for registration flow)
bot.on('message', (msg) => {
  if (msg.text === '📋 Status Saya') {
    CommandHandlers.handleStatus(bot, msg);
    return;
  }
  if (msg.text === '🟢 Standby') {
    CommandHandlers.handleStandby(bot, msg);
    return;
  }
  if (msg.text === '🔴 Off') {
    CommandHandlers.handleOff(bot, msg);
    return;
  }
  if (msg.text === '🚚 Pesanan Aktif') {
    CommandHandlers.handleActiveOrders(bot, msg);
    return;
  }
  if (msg.text === '📝 Registrasi Driver') {
    CommandHandlers.handleRegistDriver(bot, msg);
    return;
  }

  // Skip if it's a command (starts with /)
  if (msg.text && !msg.text.startsWith('/')) {
    CommandHandlers.handleTextMessage(bot, msg);
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
StatusSchedulerService.start();