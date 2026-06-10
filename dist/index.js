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
// Set up a unified message handler to route all commands and text
bot.on('message', (msg) => {
    const text = msg.text;
    if (!text)
        return;
    // If the message is not a command, pass it to the text message handler (for registration)
    if (!text.startsWith('/')) {
        commandHandlers_1.default.handleTextMessage(bot, msg);
        return;
    }
    // Parse command and arguments
    const [command, ...args] = text.split(' ');
    const messageText = args.join(' ');
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
        case '/active_orders':
            commandHandlers_1.default.handleActiveOrders(bot, msg);
            break;
        // Admin Commands
        case '/off_all_driver':
            commandHandlers_1.default.handleOffAllDriver(bot, msg);
            break;
        case '/listorder':
            commandHandlers_1.default.handleListOrder(bot, msg);
            break;
        case '/cekpenghasilan':
            commandHandlers_1.default.handleCekPenghasilan(bot, msg);
            break;
        case '/bc':
            commandHandlers_1.default.handleBroadcast(bot, msg, messageText);
            break;
        case '/bc-standby':
            commandHandlers_1.default.handleBroadcastStandby(bot, msg, messageText);
            break;
        case '/bc-off':
            commandHandlers_1.default.handleBroadcastOff(bot, msg, messageText);
            break;
        // Fallback for unknown commands
        default:
            bot.sendMessage(msg.chat.id, '🤔 Perintah tidak dikenali.\n\nSilakan gunakan tombol menu yang tersedia atau ketik /start untuk memulai.');
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