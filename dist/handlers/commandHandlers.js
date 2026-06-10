"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandlers = void 0;
const supabase_js_1 = __importDefault(require("../services/supabase.js"));
const driverStatusSync_js_1 = __importDefault(require("../services/driverStatusSync.js"));
const sessionManager_js_1 = __importDefault(require("../state/sessionManager.js"));
const messages_js_1 = __importDefault(require("../utils/messages.js"));
const keyboard_js_1 = __importDefault(require("../utils/keyboard.js"));
class CommandHandlers {
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
            if (this.isAdmin(telegramId)) {
                await bot.sendMessage(chatId, '👋 Halo Admin! Selamat datang kembali.', {
                    reply_markup: keyboard_js_1.default.createAdminMainMenuKeyboard(),
                });
                return;
            }
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (driverResponse.success && driverResponse.data) {
                await bot.sendMessage(chatId, messages_js_1.default.getAlreadyRegisteredMessage(), {
                    reply_markup: keyboard_js_1.default.createDriverMainMenuKeyboard(),
                });
                return;
            }
            await bot.sendMessage(chatId, messages_js_1.default.getWelcomeMessage(), {
                reply_markup: keyboard_js_1.default.createUnregisteredKeyboard(),
            });
        }
        catch (error) {
            console.error('❌ Error in /start handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
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
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (driverResponse.success && driverResponse.data) {
                await bot.sendMessage(chatId, messages_js_1.default.getAlreadyRegisteredMessage());
                return;
            }
            // Start registration flow
            sessionManager_js_1.default.setSession(telegramId, 'waiting_name');
            await bot.sendMessage(chatId, messages_js_1.default.getRegistrationStartMessage());
        }
        catch (error) {
            console.error('❌ Error in /regist_driver handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
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
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.sendMessage(chatId, messages_js_1.default.getNotRegisteredMessage());
                return;
            }
            const driver = driverResponse.data;
            // Get driver statistics
            const statsResponse = await supabase_js_1.default.getDriverStats(driver.id);
            if (!statsResponse.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil statistik'));
                return;
            }
            // Get active orders list
            const activeOrdersResponse = await supabase_js_1.default.getDriverActiveOrders(driver.id);
            const activeOrders = activeOrdersResponse.data || [];
            const stats = statsResponse.data;
            const statusMessage = messages_js_1.default.getDriverStatusMessage(driver, stats, activeOrders);
            await bot.sendMessage(chatId, statusMessage);
        }
        catch (error) {
            console.error('❌ Error in /status handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleActiveOrders(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId)
            return;
        try {
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data || !driverResponse.data.id) {
                await bot.sendMessage(chatId, messages_js_1.default.getNotRegisteredMessage());
                return;
            }
            const activeOrdersResponse = await supabase_js_1.default.getDriverActiveOrders(driverResponse.data.id);
            const activeOrders = activeOrdersResponse.data || [];
            if (!activeOrders.length) {
                await bot.sendMessage(chatId, messages_js_1.default.getNoActiveOrdersMessage());
                return;
            }
            for (const order of activeOrders) {
                await bot.sendMessage(chatId, messages_js_1.default.getActiveOrderItemMessage(order), {
                    reply_markup: keyboard_js_1.default.createActiveOrderActionKeyboard(order.order_code, order.status),
                });
            }
        }
        catch (error) {
            console.error('❌ Error in /active_orders handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
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
            if (this.isAdmin(telegramId)) {
                // Admin functionality: List standby drivers
                const response = await supabase_js_1.default.getDriversByStatus('standby');
                if (!response.success) {
                    await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil daftar driver standby.'));
                    return;
                }
                const message = messages_js_1.default.getStandbyDriversListMessage(response.data || []);
                await bot.sendMessage(chatId, message);
            }
            else {
                // Driver functionality: Set own status to standby
                const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
                if (!driverResponse.success || !driverResponse.data) {
                    await bot.sendMessage(chatId, messages_js_1.default.getNotRegisteredMessage());
                    return;
                }
                const driver = driverResponse.data;
                if (driver.status === 'off') {
                    await supabase_js_1.default.updateDriverStatus(telegramId, 'standby');
                }
                const syncResult = await driverStatusSync_js_1.default.syncFromActiveOrders(telegramId, driver.id, { respectOff: false });
                await bot.sendMessage(chatId, messages_js_1.default.getStatusUpdatedMessage(syncResult.status));
            }
        }
        catch (error) {
            console.error('❌ Error in /standby handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
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
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.sendMessage(chatId, messages_js_1.default.getNotRegisteredMessage());
                return;
            }
            // Update status to off
            const updateResponse = await supabase_js_1.default.updateDriverStatus(telegramId, 'off');
            if (!updateResponse.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengubah status'));
                return;
            }
            await bot.sendMessage(chatId, messages_js_1.default.getStatusUpdatedMessage('off'));
        }
        catch (error) {
            console.error('❌ Error in /off handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
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
            const response = await supabase_js_1.default.updateAllDriversStatus('off');
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengubah semua driver jadi OFF'));
                return;
            }
            await bot.sendMessage(chatId, `✅ Semua driver diubah ke OFF (${response.data?.length || 0} driver).`);
        }
        catch (error) {
            console.error('❌ Error in /off_all_driver handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    // ============== ADMIN COMMANDS ==============
    static async _broadcastMessage(bot, adminChatId, drivers, message, targetGroup) {
        if (!drivers || drivers.length === 0) {
            await bot.sendMessage(adminChatId, `🟡 Tidak ada driver dalam kelompok target (${targetGroup}) untuk dikirimi pesan.`);
            return;
        }
        const formattedMessage = messages_js_1.default.getAdminBroadcastMessage(message);
        let successCount = 0;
        let failureCount = 0;
        for (const driver of drivers) {
            if (driver.telegram_id) {
                try {
                    await bot.sendMessage(driver.telegram_id, formattedMessage);
                    successCount++;
                }
                catch (error) {
                    failureCount++;
                    console.error(`❌ Gagal mengirim broadcast ke ${driver.nama_driver} (${driver.telegram_id}):`, error.message);
                }
            }
        }
        await bot.sendMessage(adminChatId, `✅ Broadcast selesai.\n\n- Terkirim: ${successCount} driver\n- Gagal: ${failureCount} driver`);
    }
    static async handleListOrder(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !this.isAdmin(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        try {
            const response = await supabase_js_1.default.getRecentOrders();
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil daftar order.'));
                return;
            }
            const orders = response.data || [];
            if (orders.length === 0) {
                await bot.sendMessage(chatId, messages_js_1.default.getNoRecentOrdersMessage());
                return;
            }
            await bot.sendMessage(chatId, `📦 Menampilkan ${orders.length} order terakhir:`);
            for (const order of orders) {
                const message = messages_js_1.default.getOrderListItemMessage(order);
                const keyboard = order.status === 'waiting_driver'
                    ? keyboard_js_1.default.createOrderKeyboard(order.order_code)
                    : undefined;
                await bot.sendMessage(chatId, message, {
                    reply_markup: keyboard,
                });
            }
        }
        catch (error) {
            console.error('❌ Error in /listorder handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem saat mengambil order.'));
        }
    }
    static async handleCekPenghasilan(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !this.isAdmin(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        try {
            const response = await supabase_js_1.default.getTodaysIncomeByDriver();
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil data penghasilan.'));
                return;
            }
            const message = messages_js_1.default.getDailyIncomeReportMessage(response.data || []);
            await bot.sendMessage(chatId, message);
        }
        catch (error) {
            console.error('❌ Error in /cekpenghasilan handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem saat memeriksa penghasilan.'));
        }
    }
    static async handleBroadcast(bot, msg, messageText) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !this.isAdmin(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        const message = messageText.trim();
        if (!message) {
            await bot.sendMessage(chatId, 'Format salah. Gunakan: /bc <pesan>');
            return;
        }
        try {
            const response = await supabase_js_1.default.getAllDrivers();
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil daftar semua driver.'));
                return;
            }
            await this._broadcastMessage(bot, chatId, response.data || [], message, 'semua');
        }
        catch (error) {
            console.error('❌ Error in /bc handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem saat broadcast.'));
        }
    }
    static async handleBroadcastStandby(bot, msg, messageText) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !this.isAdmin(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        const message = messageText.trim();
        if (!message) {
            await bot.sendMessage(chatId, 'Format salah. Gunakan: /bc-standby <pesan>');
            return;
        }
        try {
            const response = await supabase_js_1.default.getDriversByStatus('standby');
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil daftar driver standby.'));
                return;
            }
            await this._broadcastMessage(bot, chatId, response.data || [], message, 'standby');
        }
        catch (error) {
            console.error('❌ Error in /bc-standby handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem saat broadcast.'));
        }
    }
    static async handleBroadcastOff(bot, msg, messageText) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !this.isAdmin(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        const message = messageText.trim();
        if (!message) {
            await bot.sendMessage(chatId, 'Format salah. Gunakan: /bc-off <pesan>');
            return;
        }
        try {
            const response = await supabase_js_1.default.getDriversByStatus('off');
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil daftar driver off.'));
                return;
            }
            await this._broadcastMessage(bot, chatId, response.data || [], message, 'off');
        }
        catch (error) {
            console.error('❌ Error in /bc-off handler:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem saat broadcast.'));
        }
    }
    // Handle text messages (for registration flow)
    static async handleTextMessage(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        const text = msg.text;
        if (!telegramId || !text)
            return;
        if (text.startsWith('/')) {
            return;
        }
        // Check if user is in registration flow
        if (!sessionManager_js_1.default.isInRegistrationFlow(telegramId)) {
            return; // Ignore text messages if not in registration flow
        }
        const state = sessionManager_js_1.default.getRegistrationState(telegramId);
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
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
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
        sessionManager_js_1.default.updateSessionData(telegramId, { name: name.trim() });
        sessionManager_js_1.default.setSession(telegramId, 'waiting_driver_code');
        await bot.sendMessage(chatId, messages_js_1.default.getDriverCodeMessage());
    }
    // Handle driver code input
    static async handleDriverCodeInput(bot, chatId, telegramId, code) {
        const driverCode = code.trim().toUpperCase();
        // Validate driver code
        const codeResponse = await supabase_js_1.default.validateDriverCode(driverCode);
        if (!codeResponse.success) {
            await bot.sendMessage(chatId, messages_js_1.default.getInvalidDriverCodeMessage());
            return;
        }
        // Update session with driver code
        sessionManager_js_1.default.updateSessionData(telegramId, { driverCode });
        sessionManager_js_1.default.setSession(telegramId, 'waiting_wa');
        await bot.sendMessage(chatId, messages_js_1.default.getWhatsAppMessage());
    }
    // Handle WhatsApp input
    static async handleWhatsAppInput(bot, chatId, telegramId, phone) {
        // Validate phone number
        if (!messages_js_1.default.isValidPhoneNumber(phone)) {
            await bot.sendMessage(chatId, messages_js_1.default.getInvalidWhatsAppMessage());
            return;
        }
        const formattedPhone = messages_js_1.default.formatPhoneNumber(phone);
        // Update session with WhatsApp
        sessionManager_js_1.default.updateSessionData(telegramId, { whatsapp: formattedPhone });
        sessionManager_js_1.default.setSession(telegramId, 'waiting_initial_status');
        // Get session data for summary
        const sessionData = sessionManager_js_1.default.getSessionData(telegramId);
        if (!sessionData || !sessionData.name || !sessionData.driverCode) {
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Data registrasi tidak lengkap'));
            return;
        }
        // Show registration summary and ask for initial status
        const summaryMessage = messages_js_1.default.getRegistrationSummary(sessionData.name, sessionData.driverCode, formattedPhone);
        await bot.sendMessage(chatId, summaryMessage, {
            reply_markup: keyboard_js_1.default.createInitialStatusKeyboard(),
        });
    }
}
exports.CommandHandlers = CommandHandlers;
exports.default = CommandHandlers;
//# sourceMappingURL=commandHandlers.js.map