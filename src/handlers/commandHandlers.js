import TelegramBot from 'node-telegram-bot-api';
import SupabaseService from '../services/supabase';
import DriverStatusSyncService from '../services/driverStatusSync';
import sessionManager from '../state/sessionManager';
import MessageUtils from '../utils/messages';
import KeyboardUtils from '../utils/keyboard';
import { DriverStatus } from '../types';
export class CommandHandlers {
    static isAdmin(telegramId) {
        const raw = process.env.ADMIN_TELEGRAM_IDS || '';
        const ids = raw.split(',').map((id) => id.trim()).filter(Boolean);
        return ids.includes(telegramId);
    }
    // Handle /start command
    static async handleStart(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`📱 /start command from ${telegramId}`);
        try {
            // Check if user is already registered
            const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
            if (driverResponse.success && driverResponse.data) {
                // User is already registered
                await bot.sendMessage(chatId, MessageUtils.getAlreadyRegisteredMessage(), {
                    reply_markup: KeyboardUtils.createMainMenuKeyboard(),
                });
                return;
            }
            // Send welcome message
            await bot.sendMessage(chatId, MessageUtils.getWelcomeMessage(), {
                reply_markup: KeyboardUtils.createMainMenuKeyboard(),
            });
        }
        catch (error) {
            console.error('❌ Error in /start handler:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    // Handle /regist_driver command
    static async handleRegistDriver(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`📝 /regist_driver command from ${telegramId}`);
        try {
            // Check if user is already registered
            const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
            if (driverResponse.success && driverResponse.data) {
                await bot.sendMessage(chatId, MessageUtils.getAlreadyRegisteredMessage());
                return;
            }
            // Start registration flow
            sessionManager.setSession(telegramId, 'waiting_name');
            await bot.sendMessage(chatId, MessageUtils.getRegistrationStartMessage());
        }
        catch (error) {
            console.error('❌ Error in /regist_driver handler:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    // Handle /status command
    static async handleStatus(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`📊 /status command from ${telegramId}`);
        try {
            // Get driver data
            const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage());
                return;
            }
            const driver = driverResponse.data;
            // Get driver statistics
            const statsResponse = await SupabaseService.getDriverStats(driver.id);
            if (!statsResponse.success) {
                await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil statistik'));
                return;
            }
            // Get active orders list
            const activeOrdersResponse = await SupabaseService.getDriverActiveOrders(driver.id);
            const activeOrders = activeOrdersResponse.data || [];
            const stats = statsResponse.data;
            const statusMessage = MessageUtils.getDriverStatusMessage(driver, stats, activeOrders);
            await bot.sendMessage(chatId, statusMessage);
        }
        catch (error) {
            console.error('❌ Error in /status handler:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleActiveOrders(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        try {
            const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data || !driverResponse.data.id) {
                await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage());
                return;
            }
            const activeOrdersResponse = await SupabaseService.getDriverActiveOrders(driverResponse.data.id);
            const activeOrders = activeOrdersResponse.data || [];
            if (!activeOrders.length) {
                await bot.sendMessage(chatId, MessageUtils.getNoActiveOrdersMessage());
                return;
            }
            for (const order of activeOrders) {
                await bot.sendMessage(chatId, MessageUtils.getActiveOrderItemMessage(order), {
                    reply_markup: KeyboardUtils.createActiveOrderActionKeyboard(order.order_code, order.status),
                });
            }
        }
        catch (error) {
            console.error('❌ Error in /active_orders handler:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    // Handle /standby command
    static async handleStandby(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`🟢 /standby command from ${telegramId}`);
        try {
            // Check if user is registered
            const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage());
                return;
            }
            const driver = driverResponse.data;
            if (driver.status === 'off') {
                await SupabaseService.updateDriverStatus(telegramId, 'standby');
            }
            const syncResult = await DriverStatusSyncService.syncFromActiveOrders(telegramId, driver.id, { respectOff: false });
            await bot.sendMessage(chatId, MessageUtils.getStatusUpdatedMessage(syncResult.status));
        }
        catch (error) {
            console.error('❌ Error in /standby handler:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    // Handle /off command
    static async handleOff(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        console.log(`🔴 /off command from ${telegramId}`);
        try {
            // Check if user is registered
            const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage());
                return;
            }
            // Update status to off
            const updateResponse = await SupabaseService.updateDriverStatus(telegramId, 'off');
            if (!updateResponse.success) {
                await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengubah status'));
                return;
            }
            await bot.sendMessage(chatId, MessageUtils.getStatusUpdatedMessage('off'));
        }
        catch (error) {
            console.error('❌ Error in /off handler:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleOffAllDriver(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        if (!this.isAdmin(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Command ini hanya untuk admin.');
            return;
        }
        try {
            const response = await SupabaseService.updateAllDriversStatus('off');
            if (!response.success) {
                await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengubah semua driver jadi OFF'));
                return;
            }
            await bot.sendMessage(chatId, `✅ Semua driver diubah ke OFF (${response.data?.length || 0} driver).`);
        }
        catch (error) {
            console.error('❌ Error in /off_all_driver handler:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    // Handle text messages (for registration flow)
    static async handleTextMessage(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        const text = msg.text;
        if (!telegramId || !text)
            return;
        // Check if user is in registration flow
        if (!sessionManager.isInRegistrationFlow(telegramId)) {
            return; // Ignore text messages if not in registration flow
        }
        const state = sessionManager.getRegistrationState(telegramId);
        console.log(`💬 Text message from ${telegramId} in state: ${state}`);
        try {
            switch (state) {
                case 'waiting_name':
                    await this.handleNameInput(bot, chatId, telegramId, text);
                    break;
                case 'waiting_driver_code':
                    await this.handleDriverCodeInput(bot, chatId, telegramId, text);
                    break;
                case 'waiting_wa':
                    await this.handleWhatsAppInput(bot, chatId, telegramId, text);
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            console.error('❌ Error handling text message:', error);
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    // Handle name input
    static async handleNameInput(bot, chatId, telegramId, name) {
        // Validate name (basic validation)
        if (name.trim().length < 2) {
            await bot.sendMessage(chatId, '❌ Nama terlalu pendek. Silakan masukkan nama lengkap Anda:');
            return;
        }
        // Update session with name
        sessionManager.updateSessionData(telegramId, { name: name.trim() });
        sessionManager.setSession(telegramId, 'waiting_driver_code');
        await bot.sendMessage(chatId, MessageUtils.getDriverCodeMessage());
    }
    // Handle driver code input
    static async handleDriverCodeInput(bot, chatId, telegramId, code) {
        const driverCode = code.trim().toUpperCase();
        // Validate driver code
        const codeResponse = await SupabaseService.validateDriverCode(driverCode);
        if (!codeResponse.success) {
            await bot.sendMessage(chatId, MessageUtils.getInvalidDriverCodeMessage());
            return;
        }
        // Update session with driver code
        sessionManager.updateSessionData(telegramId, { driverCode });
        sessionManager.setSession(telegramId, 'waiting_wa');
        await bot.sendMessage(chatId, MessageUtils.getWhatsAppMessage());
    }
    // Handle WhatsApp input
    static async handleWhatsAppInput(bot, chatId, telegramId, phone) {
        // Validate phone number
        if (!MessageUtils.isValidPhoneNumber(phone)) {
            await bot.sendMessage(chatId, MessageUtils.getInvalidWhatsAppMessage());
            return;
        }
        const formattedPhone = MessageUtils.formatPhoneNumber(phone);
        // Update session with WhatsApp
        sessionManager.updateSessionData(telegramId, { whatsapp: formattedPhone });
        sessionManager.setSession(telegramId, 'waiting_initial_status');
        // Get session data for summary
        const sessionData = sessionManager.getSessionData(telegramId);
        if (!sessionData || !sessionData.name || !sessionData.driverCode) {
            await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Data registrasi tidak lengkap'));
            return;
        }
        // Show registration summary and ask for initial status
        const summaryMessage = MessageUtils.getRegistrationSummary(sessionData.name, sessionData.driverCode, formattedPhone);
        await bot.sendMessage(chatId, summaryMessage, {
            reply_markup: KeyboardUtils.createInitialStatusKeyboard(),
        });
    }
}
export default CommandHandlers;
//# sourceMappingURL=commandHandlers.js.map