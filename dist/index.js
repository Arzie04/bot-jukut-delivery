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
bot.onText(/^\/start$/, (msg) => {
    commandHandlers_1.default.handleStart(bot, msg);
});
bot.onText(/^\/regist_driver$/, (msg) => {
    commandHandlers_1.default.handleRegistDriver(bot, msg);
});
bot.onText(/^\/status$/, (msg) => {
    commandHandlers_1.default.handleStatus(bot, msg);
});
bot.onText(/^\/standby$/, (msg) => {
    commandHandlers_1.default.handleStandby(bot, msg);
});
bot.onText(/^\/off$/, (msg) => {
    commandHandlers_1.default.handleOff(bot, msg);
});
bot.onText(/^\/active_orders$/, (msg) => {
    commandHandlers_1.default.handleActiveOrders(bot, msg);
});
bot.onText(/^\/off_all_driver$/, (msg) => {
    commandHandlers_1.default.handleOffAllDriver(bot, msg);
});
// Handle text messages (for registration flow)
bot.on('message', (msg) => {
    if (msg.text === '📋 Status Saya') {
        commandHandlers_1.default.handleStatus(bot, msg);
        return;
    }
    if (msg.text === '🟢 Standby') {
        commandHandlers_1.default.handleStandby(bot, msg);
        return;
    }
    if (msg.text === '🔴 Off') {
        commandHandlers_1.default.handleOff(bot, msg);
        return;
    }
    if (msg.text === '🚚 Pesanan Aktif') {
        commandHandlers_1.default.handleActiveOrders(bot, msg);
        return;
    }
    if (msg.text === '📝 Registrasi Driver') {
        commandHandlers_1.default.handleRegistDriver(bot, msg);
        return;
    }
    // Skip if it's a command (starts with /)
    if (msg.text && !msg.text.startsWith('/')) {
        commandHandlers_1.default.handleTextMessage(bot, msg);
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
statusScheduler_1.default.start();
//# sourceMappingURL=index.js.map