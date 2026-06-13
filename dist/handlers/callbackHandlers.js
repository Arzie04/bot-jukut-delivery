"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackHandlers = void 0;
const supabase_js_1 = __importDefault(require("../services/supabase.js"));
const spreadsheet_js_1 = __importDefault(require("../services/spreadsheet.js"));
const driverStatusSync_js_1 = __importDefault(require("../services/driverStatusSync.js"));
const orderNotifier_js_1 = __importDefault(require("../services/orderNotifier.js"));
const commandHandlers_js_1 = __importDefault(require("./commandHandlers.js"));
const sessionManager_js_1 = __importDefault(require("../state/sessionManager.js"));
const messages_js_1 = __importDefault(require("../utils/messages.js"));
const keyboard_js_1 = __importDefault(require("../utils/keyboard.js"));
const scheduleService_js_1 = __importDefault(require("../services/scheduleService.js"));
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
            const data = keyboard_js_1.default.parseCallbackData(callbackData);
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
                case 'view_active_orders':
                    await commandHandlers_js_1.default.handleActiveOrders(bot, {
                        ...query.message,
                        from: query.from,
                    });
                    await bot.answerCallbackQuery(query.id);
                    break;
                case 'request_swap':
                    await this.handleRequestSwap(bot, query, telegramId, data.scheduleId);
                    break;
                case 'take_shift':
                    await this.handleTakeShift(bot, query, telegramId, data.swapRequestId);
                    break;
                case 'swap_shift':
                    await this.handleSwapShift(bot, query, telegramId, data.swapRequestId);
                    break;
                case 'take_gc':
                    await this.handleTakeGeneralCleaning(bot, query, telegramId);
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
            if (!sessionManager_js_1.default.isInRegistrationFlow(telegramId)) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Sesi registrasi tidak valid' });
                return;
            }
            // Get session data
            const sessionData = sessionManager_js_1.default.getSessionData(telegramId);
            if (!sessionData || !sessionData.name || !sessionData.driverCode || !sessionData.whatsapp) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Data registrasi tidak lengkap' });
                return;
            }
            // Create driver in database
            const driverData = {
                telegram_id: telegramId,
                nama_driver: sessionData.name,
                kode_driver: sessionData.driverCode,
                nomor_wa: sessionData.whatsapp,
                is_verified: true,
                status: status,
            };
            const createResponse = await supabase_js_1.default.createDriver(driverData);
            if (!createResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal menyimpan data driver' });
                return;
            }
            // Mark driver code as used
            await supabase_js_1.default.markDriverCodeAsUsed(sessionData.driverCode, createResponse.data?.id);
            // Clear session
            sessionManager_js_1.default.clearSession(telegramId);
            // Send completion message
            const completionMessage = messages_js_1.default.getRegistrationCompleteMessage(createResponse.data);
            // Edit the message to remove keyboard
            await bot.editMessageText(completionMessage, {
                chat_id: chatId,
                message_id: messageId,
            });
            await bot.sendMessage(chatId, 'Silakan gunakan tombol menu driver yang tersedia.', {
                reply_markup: keyboard_js_1.default.createDriverMainMenuKeyboard(),
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
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai driver' });
                return;
            }
            const driver = driverResponse.data;
            if (driver.status === 'off') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Status Anda OFF. Ubah ke STANDBY untuk mengambil order' });
                return;
            }
            // Check active orders limit
            const activeOrdersResponse = await supabase_js_1.default.getDriverActiveOrders(driver.id);
            const activeCount = activeOrdersResponse.data?.length || 0;
            if (activeCount >= 5) {
                await bot.answerCallbackQuery(query.id, { text: 'Maksimal 5 pesanan aktif tercapai', show_alert: true });
                return;
            }
            // Try to assign order to driver
            const assignResponse = await supabase_js_1.default.assignOrderToDriver(orderId, driver.id);
            if (!assignResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: assignResponse.error || '❌ Gagal mengambil order' });
                return;
            }
            await orderNotifier_js_1.default.markOrderTaken(bot, orderId, telegramId);
            // Driver tetap standby sampai klik Mulai Antar
            await driverStatusSync_js_1.default.syncFromActiveOrders(telegramId, driver.id);
            const sheetResult = await spreadsheet_js_1.default.syncOrderStatus(assignResponse.data.order_code, 'order_assigned', driver, { previousStatus: 'disiapkan-printed' });
            if (!sheetResult.success) {
                console.error(`❌ Spreadsheet sync failed (assigned):`, sheetResult);
            }
            // Send success message with new keyboard
            const assignedMessage = messages_js_1.default.getOrderAssignedMessage(assignResponse.data);
            await bot.editMessageText(assignedMessage, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: keyboard_js_1.default.createDeliveryKeyboard(orderId),
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
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai driver' });
                return;
            }
            const driver = driverResponse.data;
            if (driver.status === 'off') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Status Anda OFF' });
                return;
            }
            // Update order status to delivering
            const orderResponse = await supabase_js_1.default.updateOrderStatus(orderId, 'delivering');
            if (!orderResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal memulai delivery' });
                return;
            }
            await driverStatusSync_js_1.default.syncFromActiveOrders(telegramId, driver.id);
            const sheetResult = await spreadsheet_js_1.default.syncOrderStatus(orderResponse.data.order_code, 'order_delivering', driver, { previousStatus: 'assigned' });
            if (!sheetResult.success) {
                console.error(`❌ Spreadsheet sync failed (delivering):`, sheetResult);
            }
            // Send delivery started message with complete keyboard
            const deliveryMessage = messages_js_1.default.getDeliveryStartedMessage(orderResponse.data);
            await bot.editMessageText(deliveryMessage, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: keyboard_js_1.default.createCompleteKeyboard(orderId),
            });
            await bot.answerCallbackQuery(query.id, { text: '🚀 Delivery dimulai!' });
        }
        catch (error) {
            console.error('❌ Error in handleStartDelivery:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    static async handleRequestSwap(bot, query, telegramId, scheduleId) {
        const chatId = query.message.chat.id;
        try {
            const employeeRes = await supabase_js_1.default.getEmployeeByTelegramId(telegramId);
            if (!employeeRes.success || !employeeRes.data?.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
                return;
            }
            const scheduleRes = await supabase_js_1.default.getScheduleById(scheduleId);
            if (!scheduleRes.success || !scheduleRes.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Jadwal tidak ditemukan' });
                return;
            }
            const schedule = scheduleRes.data;
            if (schedule.employee_id !== employeeRes.data.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda bukan pemilik shift ini' });
                return;
            }
            const swapRes = await supabase_js_1.default.createSwapRequest(scheduleId, employeeRes.data.id);
            if (!swapRes.success || !swapRes.data?.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal membuat permintaan tukar' });
                return;
            }
            const dayName = scheduleService_js_1.default.getDayName(schedule.tanggal);
            const dateDisplay = scheduleService_js_1.default.formatDateDisplay(schedule.tanggal);
            const shiftLabel = schedule.shift === 'pagi' ? 'Pagi' : 'Siang';
            await bot.sendMessage(chatId, messages_js_1.default.getSwapRequestMessage(employeeRes.data.nama, dayName, dateDisplay, shiftLabel), {
                parse_mode: 'HTML',
                reply_markup: keyboard_js_1.default.createSwapActionKeyboard(swapRes.data.id),
            });
            await bot.answerCallbackQuery(query.id, { text: '✅ Permintaan tukar diposting' });
        }
        catch (error) {
            console.error('❌ Error in handleRequestSwap:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    static async handleTakeShift(bot, query, telegramId, swapRequestId) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            const takerRes = await supabase_js_1.default.getEmployeeByTelegramId(telegramId);
            if (!takerRes.success || !takerRes.data?.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
                return;
            }
            const swapRes = await supabase_js_1.default.getSwapRequestById(swapRequestId);
            if (!swapRes.success || !swapRes.data || swapRes.data.status !== 'open') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Permintaan sudah tidak aktif' });
                return;
            }
            if (swapRes.data.requester_id === takerRes.data.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Tidak bisa mengambil shift sendiri' });
                return;
            }
            const scheduleRes = await supabase_js_1.default.getScheduleById(swapRes.data.schedule_id);
            if (!scheduleRes.success || !scheduleRes.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Jadwal tidak ditemukan' });
                return;
            }
            const updateRes = await supabase_js_1.default.updateScheduleEmployee(swapRes.data.schedule_id, takerRes.data.id);
            if (!updateRes.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal mengambil shift' });
                return;
            }
            await supabase_js_1.default.completeSwapRequest(swapRequestId);
            const dayName = scheduleService_js_1.default.getDayName(scheduleRes.data.tanggal);
            const shiftLabel = scheduleRes.data.shift === 'pagi' ? 'Pagi' : 'Siang';
            await bot.editMessageText(messages_js_1.default.getSwapTakenMessage(takerRes.data.nama, dayName, shiftLabel), { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' });
            await bot.answerCallbackQuery(query.id, { text: '✅ Shift berhasil diambil!' });
        }
        catch (error) {
            console.error('❌ Error in handleTakeShift:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    static async handleSwapShift(bot, query, telegramId, swapRequestId) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            const swapperRes = await supabase_js_1.default.getEmployeeByTelegramId(telegramId);
            if (!swapperRes.success || !swapperRes.data?.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
                return;
            }
            const swapRes = await supabase_js_1.default.getSwapRequestById(swapRequestId);
            if (!swapRes.success || !swapRes.data || swapRes.data.status !== 'open') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Permintaan sudah tidak aktif' });
                return;
            }
            if (swapRes.data.requester_id === swapperRes.data.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Tidak bisa tukar dengan diri sendiri' });
                return;
            }
            const requesterScheduleRes = await supabase_js_1.default.getScheduleById(swapRes.data.schedule_id);
            if (!requesterScheduleRes.success || !requesterScheduleRes.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Jadwal tidak ditemukan' });
                return;
            }
            const today = scheduleService_js_1.default.formatDate(new Date());
            const swapperSchedulesRes = await supabase_js_1.default.getEmployeeFutureSchedules(swapperRes.data.id, today);
            const swapperSchedules = (swapperSchedulesRes.data || []).filter((s) => s.id !== swapRes.data.schedule_id);
            if (swapperSchedules.length === 0) {
                await bot.answerCallbackQuery(query.id, {
                    text: '❌ Anda tidak punya jadwal mendatang untuk ditukar',
                    show_alert: true,
                });
                return;
            }
            const swapperSchedule = swapperSchedules[0];
            await supabase_js_1.default.updateScheduleEmployee(swapRes.data.schedule_id, swapperRes.data.id);
            await supabase_js_1.default.updateScheduleEmployee(swapperSchedule.id, swapRes.data.requester_id);
            await supabase_js_1.default.completeSwapRequest(swapRequestId);
            const requesterRes = await supabase_js_1.default.getEmployeeById(swapRes.data.requester_id);
            const requesterName = requesterRes.data?.nama || 'Karyawan';
            await bot.editMessageText(messages_js_1.default.getSwapCompletedMessage(requesterName, swapperRes.data.nama), { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' });
            await bot.answerCallbackQuery(query.id, { text: '🔁 Tukar jadwal berhasil!' });
        }
        catch (error) {
            console.error('❌ Error in handleSwapShift:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    static async handleTakeGeneralCleaning(bot, query, telegramId) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            const employeeRes = await supabase_js_1.default.getEmployeeByTelegramId(telegramId);
            if (!employeeRes.success || !employeeRes.data?.id) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
                return;
            }
            const today = scheduleService_js_1.default.formatDate(new Date());
            const alreadyTaken = await supabase_js_1.default.hasEmployeeTakenGcOnDate(employeeRes.data.id, today);
            if (alreadyTaken.success && alreadyTaken.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda sudah terdaftar GC hari ini' });
                return;
            }
            const countRes = await supabase_js_1.default.countGeneralCleaningForDate(today);
            if (countRes.success && (countRes.data || 0) >= 2) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Slot General Cleaning sudah penuh' });
                return;
            }
            const logRes = await supabase_js_1.default.createGeneralCleaningLog(today, employeeRes.data.id);
            if (!logRes.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal mendaftar GC' });
                return;
            }
            const newCount = (countRes.data || 0) + 1;
            const logsRes = await supabase_js_1.default.getGeneralCleaningLogsForWeek(today, today);
            const names = (logsRes.data || [])
                .map((log) => {
                const emp = Array.isArray(log.employees) ? log.employees[0] : log.employees;
                return emp?.nama || employeeRes.data.nama;
            })
                .filter(Boolean);
            if (newCount >= 2) {
                await bot.editMessageText(messages_js_1.default.getGeneralCleaningTakenMessage(names), {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'HTML',
                });
            }
            else {
                await bot.answerCallbackQuery(query.id, { text: `✅ ${employeeRes.data.nama} terdaftar GC (${newCount}/2)` });
            }
        }
        catch (error) {
            console.error('❌ Error in handleTakeGeneralCleaning:', error);
            await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
        }
    }
    // Handle completing delivery
    static async handleCompleteDelivery(bot, query, telegramId, orderId) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        try {
            // Check if driver is registered and has delivering status
            const driverResponse = await supabase_js_1.default.getDriverByTelegramId(telegramId);
            if (!driverResponse.success || !driverResponse.data) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai driver' });
                return;
            }
            const driver = driverResponse.data;
            const activeBefore = await supabase_js_1.default.getDriverActiveOrders(driver.id);
            const orderStillActive = activeBefore.data?.find((o) => o.order_code === orderId);
            if (!orderStillActive || orderStillActive.status !== 'delivering') {
                await bot.answerCallbackQuery(query.id, { text: '❌ Pesanan belum dalam status pengantaran' });
                return;
            }
            const orderResponse = await supabase_js_1.default.updateOrderStatus(orderId, 'completed');
            if (!orderResponse.success) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Gagal menyelesaikan delivery' });
                return;
            }
            await driverStatusSync_js_1.default.syncFromActiveOrders(telegramId, driver.id);
            const sheetResult = await spreadsheet_js_1.default.syncOrderStatus(orderResponse.data.order_code, 'order_completed', driver, { previousStatus: 'delivering' });
            if (!sheetResult.success) {
                console.error(`❌ Spreadsheet sync failed (completed):`, sheetResult);
            }
            // Send completion message (remove keyboard)
            const completionMessage = messages_js_1.default.getDeliveryCompletedMessage(orderResponse.data);
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