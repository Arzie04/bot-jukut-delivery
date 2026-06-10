"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const config_1 = require("./config");
const commandHandlers_1 = __importDefault(require("./handlers/commandHandlers"));
const callbackHandlers_1 = __importDefault(require("./handlers/callbackHandlers"));
const orderNotifier_1 = __importDefault(require("./services/orderNotifier"));
const statusScheduler_1 = __importDefault(require("./services/statusScheduler"));
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
// Set up command handlers
bot.onText(/^\/start$/, (msg) => commandHandlers_1.default.handleStart(bot, msg));
bot.onText(/^\/regist_driver$/, (msg) => commandHandlers_1.default.handleRegistDriver(bot, msg));
bot.onText(/^\/status$/, (msg) => commandHandlers_1.default.handleStatus(bot, msg));
bot.onText(/^\/standby$/, (msg) => commandHandlers_1.default.handleStandby(bot, msg));
bot.onText(/^\/off$/, (msg) => commandHandlers_1.default.handleOff(bot, msg));
bot.onText(/^\/active_orders$/, (msg) => commandHandlers_1.default.handleActiveOrders(bot, msg));
// Admin commands
bot.onText(/^\/off_all_driver$/, (msg) => commandHandlers_1.default.handleOffAllDriver(bot, msg));
bot.onText(/^\/listorder$/, (msg) => commandHandlers_1.default.handleListOrder(bot, msg));
bot.onText(/^\/cekpenghasilan$/, (msg) => commandHandlers_1.default.handleCekPenghasilan(bot, msg));
bot.onText(/^\/bc (.+)/, (msg, match) => commandHandlers_1.default.handleBroadcast(bot, msg, match));
bot.onText(/^\/bc-standby (.+)/, (msg, match) => commandHandlers_1.default.handleBroadcastStandby(bot, msg, match));
bot.onText(/^\/bc-off (.+)/, (msg, match) => commandHandlers_1.default.handleBroadcastOff(bot, msg, match));
// Fallback for unknown commands
bot.on('message', (msg) => {
    if (msg.text?.startsWith('/')) {
        // This is a command, but it was not caught by any of the specific handlers above.
        bot.sendMessage(msg.chat.id, '🤔 Perintah tidak dikenali.\n\nSilakan gunakan tombol menu yang tersedia atau ketik /start untuk memulai.');
        return;
    }
    // If it's not a command, process it as a potential registration message.
    commandHandlers_1.default.handleTextMessage(bot, msg);
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