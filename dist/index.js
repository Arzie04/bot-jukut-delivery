"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const config_1 = require("./config");
const commandHandlers_1 = __importDefault(require("./handlers/commandHandlers"));
const callbackHandlers_1 = __importDefault(require("./handlers/callbackHandlers"));
const employeeHandlers_1 = __importDefault(require("./handlers/employeeHandlers"));
const orderNotifier_1 = __importDefault(require("./services/orderNotifier"));
const statusScheduler_1 = __importDefault(require("./services/statusScheduler"));
const auth_1 = require("./utils/auth");
const messages_1 = __importDefault(require("./utils/messages"));
// Initialize bot
const bot = new node_telegram_bot_api_1.default(config_1.config.botToken, {
    polling: {
        interval: config_1.config.polling.interval,
        autoStart: true,
        params: {
            timeout: config_1.config.polling.timeout,
        },
    },
});
console.log('🤖 Bot driver Jukut starting...');
// Set up a unified message handler to route all commands and text
bot.on('message', (msg) => {
    const text = msg.text;
    if (!text)
        return;
    const chatType = msg.chat.type;
    const isPrivate = (0, auth_1.isPrivateChat)(chatType);
    const isGroup = (0, auth_1.isGroupChat)(chatType);
    // Non-command text: registration flows (private only)
    if (!text.startsWith('/')) {
        if (isPrivate) {
            commandHandlers_1.default.handleTextMessage(bot, msg);
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
                employeeHandlers_1.default.handleJadwal(bot, msg);
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
    if (!isPrivate)
        return;
    switch (command) {
        // General Commands
        case '/start':
            commandHandlers_1.default.handleStart(bot, msg);
            break;
        case '/regist_driver':
            commandHandlers_1.default.handleRegistDriver(bot, msg);
            break;
        case '/status':
            commandHandlers_1.default.handleStatus(bot, msg);
            break;
        case '/standby':
            commandHandlers_1.default.handleStandby(bot, msg);
            break;
        case '/off':
            commandHandlers_1.default.handleOff(bot, msg);
            break;
        case '/active_order':
        case '/active_orders':
            commandHandlers_1.default.handleActiveOrders(bot, msg);
            break;
        // Employee Commands (private)
        case '/regist_karyawan':
            employeeHandlers_1.default.handleRegistKaryawan(bot, msg);
            break;
        case '/buat_jadwal':
            employeeHandlers_1.default.handleBuatJadwal(bot, msg);
            break;
        case '/general_cleaning':
            employeeHandlers_1.default.handleGeneralCleaning(bot, msg);
            break;
        case '/list_gaji':
            employeeHandlers_1.default.handleListGaji(bot, msg);
            break;
        case '/generate_code':
            employeeHandlers_1.default.handleGenerateCode(bot, msg, messageText.trim() || undefined);
            break;
        case '/jadwal':
            employeeHandlers_1.default.handleJadwal(bot, msg);
            break;
        // Admin Commands (driver)
        case '/admin':
            commandHandlers_1.default.handleAdmin(bot, msg);
            break;
        case '/off_all_driver':
            commandHandlers_1.default.handleOffAllDriver(bot, msg);
            break;
        case '/listorder':
            commandHandlers_1.default.handleListOrder(bot, msg);
            break;
        case '/cekpenghasilan':
            commandHandlers_1.default.handleCekPenghasilan(bot, msg);
            break;
        case '/list_standby':
            commandHandlers_1.default.handleListStandby(bot, msg);
            break;
        case '/bc':
            commandHandlers_1.default.handleBroadcast(bot, msg, messageText);
            break;
        case '/bc_standby':
        case '/bc-standby':
            commandHandlers_1.default.handleBroadcastStandby(bot, msg, messageText);
            break;
        case '/bc_off':
        case '/bc-off':
            commandHandlers_1.default.handleBroadcastOff(bot, msg, messageText);
            break;
        // Fallback for unknown commands
        default:
            bot.sendMessage(msg.chat.id, messages_1.default.getErrorMessage('Perintah tidak dikenali') + '\n\nSilakan gunakan tombol menu yang tersedia atau ketik /start untuk memulai.');
            break;
    }
});
// Handle callback queries (inline keyboard button clicks)
bot.on('callback_query', (query) => {
    callbackHandlers_1.default.handleCallbackQuery(bot, query);
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
    orderNotifier_1.default.stop();
    statusScheduler_1.default.stop();
    bot.stopPolling();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down bot...');
    orderNotifier_1.default.stop();
    statusScheduler_1.default.stop();
    bot.stopPolling();
    process.exit(0);
});
console.log('✅ Bot driver Jukut is running!');
console.log('📱 Listening for messages...');
orderNotifier_1.default.start(bot);
statusScheduler_1.default.start(bot);
//# sourceMappingURL=index.js.map