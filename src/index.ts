import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import CommandHandlers from './handlers/commandHandlers';
import CallbackHandlers from './handlers/callbackHandlers';
import EmployeeHandlers from './handlers/employeeHandlers';
import OrderNotifierService from './services/orderNotifier';
import StatusSchedulerService from './services/statusScheduler';
import { isGroupChat, isPrivateChat } from './utils/auth';
import MessageUtils from './utils/messages';

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

  const chatType = msg.chat.type;
  const isPrivate = isPrivateChat(chatType);
  const isGroup = isGroupChat(chatType);

  // Non-command text: registration flows (private only)
  if (!text.startsWith('/')) {
    if (isPrivate) {
      CommandHandlers.handleTextMessage(bot, msg);
    }
    return;
  }

  // Parse command and arguments
  const [command, ...args] = text.split(' ');
  const messageText = args.join(' ');

  // Group chat commands
  if (isGroup) {
    switch (command) {
      case '/jadwal':
        EmployeeHandlers.handleJadwal(bot, msg);
        break;
      case '/start':
        bot.sendMessage(msg.chat.id, '👋 Halo! Gunakan /jadwal untuk melihat jadwal mingguan.');
        break;
      default:
        bot.sendMessage(msg.chat.id, '🤔 Perintah grup tidak dikenali.\n\nGunakan /jadwal untuk melihat jadwal mingguan.');
        break;
    }
    return;
  }

  // Private chat commands
  if (!isPrivate) return;

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
    case '/active_order':
    case '/active_orders':
      CommandHandlers.handleActiveOrders(bot, msg);
      break;

    // Employee Commands (private)
    case '/regist_karyawan':
      EmployeeHandlers.handleRegistKaryawan(bot, msg);
      break;
    case '/tukar_jadwal':
      EmployeeHandlers.handleTukarJadwal(bot, msg);
      break;
    case '/buat_jadwal':
      EmployeeHandlers.handleBuatJadwal(bot, msg);
      break;
    case '/general_cleaning':
      EmployeeHandlers.handleGeneralCleaning(bot, msg);
      break;
    case '/list_gaji':
      EmployeeHandlers.handleListGaji(bot, msg);
      break;
    case '/generate_code':
      EmployeeHandlers.handleGenerateCode(bot, msg, messageText.trim() || undefined);
      break;
    case '/jadwal':
      EmployeeHandlers.handleJadwal(bot, msg);
      break;

    // Admin Commands (driver)
    case '/admin':
      CommandHandlers.handleAdmin(bot, msg);
      break;
    case '/off_all_driver':
      CommandHandlers.handleOffAllDriver(bot, msg);
      break;
    case '/listorder':
      CommandHandlers.handleListOrder(bot, msg);
      break;
    case '/cekpenghasilan':
      CommandHandlers.handleCekPenghasilan(bot, msg);
      break;
    case '/list_standby':
      CommandHandlers.handleListStandby(bot, msg);
      break;
    case '/bc':
      CommandHandlers.handleBroadcast(bot, msg, messageText);
      break;
    case '/bc_standby':
    case '/bc-standby':
      CommandHandlers.handleBroadcastStandby(bot, msg, messageText);
      break;
    case '/bc_off':
    case '/bc-off':
      CommandHandlers.handleBroadcastOff(bot, msg, messageText);
      break;

    // Fallback for unknown commands
    default:
      bot.sendMessage(msg.chat.id, MessageUtils.getErrorMessage('Perintah tidak dikenali') + '\n\nSilakan gunakan tombol menu yang tersedia atau ketik /start untuk memulai.');
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
