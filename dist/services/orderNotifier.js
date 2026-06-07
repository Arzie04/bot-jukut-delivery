"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = __importDefault(require("./supabase"));
const messages_1 = __importDefault(require("../utils/messages"));
const keyboard_1 = __importDefault(require("../utils/keyboard"));
class OrderNotifierService {
    static intervalId = null;
    static isProcessing = false;
    static notifiedDriversByOrder = new Map();
    static messageRefsByOrder = new Map();
    static pollIntervalMs = 3000;
    static start(bot) {
        if (this.intervalId)
            return;
        // Run immediately once so first order is not delayed.
        this.processWaitingOrders(bot);
        this.intervalId = setInterval(() => {
            this.processWaitingOrders(bot);
        }, this.pollIntervalMs);
        console.log(`📣 Order notifier started (${this.pollIntervalMs}ms interval)`);
    }
    static stop() {
        if (!this.intervalId)
            return;
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.notifiedDriversByOrder.clear();
        this.messageRefsByOrder.clear();
        console.log('🛑 Order notifier stopped');
    }
    static async markOrderTaken(bot, orderCode, takenByTelegramId) {
        const messageRefs = this.messageRefsByOrder.get(orderCode);
        if (!messageRefs)
            return;
        const tasks = [];
        for (const [telegramId, messageId] of messageRefs.entries()) {
            if (telegramId === takenByTelegramId)
                continue;
            const chatId = Number(telegramId);
            if (!Number.isFinite(chatId))
                continue;
            tasks.push(bot.editMessageText('❌ Order ini sudah diambil driver lain.', {
                chat_id: chatId,
                message_id: messageId,
            }).catch((error) => {
                console.error(`❌ Failed to update taken-order message for ${telegramId}:`, error);
            }));
        }
        await Promise.all(tasks);
        this.notifiedDriversByOrder.delete(orderCode);
        this.messageRefsByOrder.delete(orderCode);
    }
    static async processWaitingOrders(bot) {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        try {
            const [ordersResponse, driversResponse] = await Promise.all([
                supabase_1.default.getWaitingOrders(),
                supabase_1.default.getEligibleDriversForBroadcast(),
            ]);
            if (!ordersResponse.success || !ordersResponse.data) {
                if (ordersResponse.error) {
                    console.error('❌ Failed to fetch waiting orders:', ordersResponse.error);
                }
                return;
            }
            if (!driversResponse.success || !driversResponse.data) {
                if (driversResponse.error) {
                    console.error('❌ Failed to fetch eligible drivers:', driversResponse.error);
                }
                return;
            }
            const waitingOrders = ordersResponse.data;
            const standbyDrivers = driversResponse.data;
            const activeOrderCodes = new Set(waitingOrders.map((order) => order.order_code));
            // Cleanup orders that are no longer waiting.
            for (const orderCode of this.notifiedDriversByOrder.keys()) {
                if (!activeOrderCodes.has(orderCode)) {
                    this.notifiedDriversByOrder.delete(orderCode);
                    this.messageRefsByOrder.delete(orderCode);
                }
            }
            for (const order of waitingOrders) {
                const notifiedDrivers = this.notifiedDriversByOrder.get(order.order_code) ?? new Set();
                const messageRefs = this.messageRefsByOrder.get(order.order_code) ?? new Map();
                this.notifiedDriversByOrder.set(order.order_code, notifiedDrivers);
                this.messageRefsByOrder.set(order.order_code, messageRefs);
                for (const driver of standbyDrivers) {
                    if (!driver.telegram_id || notifiedDrivers.has(driver.telegram_id)) {
                        continue;
                    }
                    const chatId = Number(driver.telegram_id);
                    if (!Number.isFinite(chatId)) {
                        continue;
                    }
                    try {
                        const sentMessage = await bot.sendMessage(chatId, messages_1.default.getOrderBroadcastMessage(order), { reply_markup: keyboard_1.default.createOrderKeyboard(order.order_code) });
                        notifiedDrivers.add(driver.telegram_id);
                        messageRefs.set(driver.telegram_id, sentMessage.message_id);
                    }
                    catch (sendError) {
                        console.error(`❌ Failed to notify driver ${driver.telegram_id}:`, sendError);
                    }
                }
            }
        }
        catch (error) {
            console.error('❌ Error in order notifier:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
}
exports.default = OrderNotifierService;
//# sourceMappingURL=orderNotifier.js.map