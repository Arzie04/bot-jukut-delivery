"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackHandlers = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const supabase_1 = __importDefault(require("../services/supabase"));
const sessionManager_1 = __importDefault(require("../state/sessionManager"));
const messages_1 = __importDefault(require("../utils/messages"));
const keyboard_1 = __importDefault(require("../utils/keyboard"));
const types_1 = require("../types");
class CallbackHandlers {
    // Handle callback queries (inline keyboard button clicks)
    static async handleCallbackQuery(bot, query) {
        const chatId = query.message?.chat.id;
        const messageId = query.message?.message_id;
        const telegramId = query.from.id.toString();
        const callbackData = query.data;
        if (!chatId || !callbackData)
            return;
        console.log(`🔘 Callback query from ${telegramId}: ${callbackData}`);
        try {
            // Parse callback data
            const data = keyboard_1.default.parseCallbackData(callbackData);
            if (!data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Data tidak valid' });
                return;
            }
            // Handle different callback actions
            switch (data.action) {
                case 'set_status':
                    await this.handleSetStatus(bot, query, telegramId, data.status);
                    break;
                case 'take_order':
                    await this.handleTakeOrder(bot, query, telegramId, data.orderId);
                    break;
                case 'start_delivery':
                    await this.handleStartDelivery(bot, query, telegramId, data.orderId);
                    break;
                case 'complete_delivery':
                    await this.handleCompleteDelivery(bot, query, telegramId, data.orderId);
                    break;
                default:
                    await bot.answerCallbackQuery(query.id, { text: '❌ Aksi tidak dikenal' });
                    break;
            }
        }
        catch (error) {
            console.error('❌ Error handling callback query:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    // Handle initial status selection during registration
    static async handleSetStatus(bot, query, telegramId, status) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            // Check if user is in registration flow
            if (!sessionManager_1.default.isInRegistrationFlow(telegramId)) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Sesi registrasi tidak valid' });
                return;
            }
            // Get session data
            const sessionData = sessionManager_1.default.getSessionData(telegramId);
            if (!sessionData || !sessionData.name || !sessionData.driverCode || !sessionData.whatsapp) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Data registrasi tidak lengkap' });
                return;
            }
            // Create driver in database
            const driverData = {
                telegram_id: telegramId,
                nama_driver: sessionData.name,
                kode: sessionData.driverCode,
                whatsapp: sessionData.whatsapp,
                status: status,
            };
            const createResponse = await supabase_1.default.createDriver(driverData);
            if (!createResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal menyimpan data driver' });
                return;
            }
            // Mark driver code as used
            await supabase_1.default.markDriverCodeAsUsed(sessionData.driverCode);
            // Clear session
            sessionManager_1.default.clearSession(telegramId);
            // Send completion message
            const completionMessage = messages_1.default.getRegistrationCompleteMessage(createResponse.data);
            // Edit the message to remove keyboard
            await bot.editMessageText(completionMessage, {
                chat_id: chatId,
                message_id: messageId,
            });
            await bot.answerCallbackQuery(query.id, { text: '✅ Registrasi berhasil!' });
        }
        catch (error) {
            console.error('❌ Error in handleSetStatus:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    // Handle taking an order
    static async handleTakeOrder(bot, query, telegramId, orderId) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            // Check if driver is registered and in standby status
            const driverResponse = await supabase_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai driver' });
                return;
            }
            const driver = driverResponse.data;
            if (driver.status !== 'standby') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Status Anda harus STANDBY untuk mengambil order' });
                return;
            }
            // Try to assign order to driver
            const assignResponse = await supabase_1.default.assignOrderToDriver(orderId, driver.id);
            if (!assignResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: assignResponse.error || '❌ Gagal mengambil order' });
                return;
            }
            // Update driver status to assigned
            await supabase_1.default.updateDriverStatus(telegramId, 'assigned');
            // Send success message with new keyboard
            const assignedMessage = messages_1.default.getOrderAssignedMessage(assignResponse.data);
            await bot.editMessageText(assignedMessage, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: keyboard_1.default.createDeliveryKeyboard(orderId),
            });
            await bot.answerCallbackQuery(query.id, { text: '✅ Order berhasil diambil!' });
        }
        catch (error) {
            console.error('❌ Error in handleTakeOrder:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    // Handle starting delivery
    static async handleStartDelivery(bot, query, telegramId, orderId) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            // Check if driver is registered and has assigned status
            const driverResponse = await supabase_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai driver' });
                return;
            }
            const driver = driverResponse.data;
            if (driver.status !== 'assigned') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda tidak memiliki order yang assigned' });
                return;
            }
            // Update order status to delivering
            const orderResponse = await supabase_1.default.updateOrderStatus(orderId, 'delivering');
            if (!orderResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal memulai delivery' });
                return;
            }
            // Update driver status to delivering
            await supabase_1.default.updateDriverStatus(telegramId, 'delivering');
            // Send delivery started message with complete keyboard
            const deliveryMessage = messages_1.default.getDeliveryStartedMessage(orderResponse.data);
            await bot.editMessageText(deliveryMessage, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: keyboard_1.default.createCompleteKeyboard(orderId),
            });
            await bot.answerCallbackQuery(query.id, { text: '🚀 Delivery dimulai!' });
        }
        catch (error) {
            console.error('❌ Error in handleStartDelivery:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    // Handle completing delivery
    static async handleCompleteDelivery(bot, query, telegramId, orderId) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            // Check if driver is registered and has delivering status
            const driverResponse = await supabase_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai driver' });
                return;
            }
            const driver = driverResponse.data;
            if (driver.status !== 'delivering') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda tidak sedang melakukan delivery' });
                return;
            }
            // Update order status to completed
            const orderResponse = await supabase_1.default.updateOrderStatus(orderId, 'completed');
            if (!orderResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal menyelesaikan delivery' });
                return;
            }
            // Update driver status back to standby
            await supabase_1.default.updateDriverStatus(telegramId, 'standby');
            // Send completion message (remove keyboard)
            const completionMessage = messages_1.default.getDeliveryCompletedMessage(orderResponse.data);
            await bot.editMessageText(completionMessage, {
                chat_id: chatId,
                message_id: messageId,
            });
            await bot.answerCallbackQuery(query.id, { text: '🎉 Delivery selesai!' });
        }
        catch (error) {
            console.error('❌ Error in handleCompleteDelivery:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
}
exports.CallbackHandlers = CallbackHandlers;
exports.default = CallbackHandlers;
//# sourceMappingURL=callbackHandlers.js.map