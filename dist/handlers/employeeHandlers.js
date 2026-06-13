"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeHandlers = void 0;
const supabase_js_1 = __importDefault(require("../services/supabase.js"));
const scheduleService_js_1 = __importDefault(require("../services/scheduleService.js"));
const sessionManager_js_1 = __importDefault(require("../state/sessionManager.js"));
const messages_js_1 = __importDefault(require("../utils/messages.js"));
const keyboard_js_1 = __importDefault(require("../utils/keyboard.js"));
const auth_js_1 = require("../utils/auth.js");
const index_js_1 = require("../config/index.js");
class EmployeeHandlers {
    static async handleRegistKaryawan(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !(0, auth_js_1.isPrivateChat)(msg.chat.type)) {
            if (telegramId) {
                await bot.sendMessage(chatId, '⛔ Registrasi karyawan hanya bisa dilakukan di chat pribadi dengan bot.');
            }
            return;
        }
        try {
            const existing = await supabase_js_1.default.getEmployeeByTelegramId(telegramId);
            if (existing.success && existing.data) {
                await bot.sendMessage(chatId, messages_js_1.default.getEmployeeAlreadyRegisteredMessage());
                return;
            }
            sessionManager_js_1.default.setSession(telegramId, 'employee', 'waiting_employee_name');
            await bot.sendMessage(chatId, messages_js_1.default.getEmployeeRegistrationStartMessage());
        }
        catch (error) {
            console.error('❌ Error in /regist_karyawan:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleBuatJadwal(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !(0, auth_js_1.isPrivateChat)(msg.chat.type)) {
            await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
            return;
        }
        if (!(0, auth_js_1.isAdmin)(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        sessionManager_js_1.default.setSession(telegramId, 'admin_schedule', 'waiting_shift_limit');
        await bot.sendMessage(chatId, messages_js_1.default.getShiftLimitPromptMessage());
    }
    static async handleGeneralCleaning(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !(0, auth_js_1.isPrivateChat)(msg.chat.type)) {
            await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
            return;
        }
        if (!(0, auth_js_1.isAdmin)(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        const groupChatId = index_js_1.config.employeeGroupChatId;
        if (!groupChatId) {
            await bot.sendMessage(chatId, '❌ EMPLOYEE_GROUP_CHAT_ID belum dikonfigurasi di environment.');
            return;
        }
        try {
            const today = scheduleService_js_1.default.formatDate(new Date());
            const countRes = await supabase_js_1.default.countGeneralCleaningForDate(today);
            if (countRes.success && (countRes.data || 0) >= 2) {
                await bot.sendMessage(chatId, 'ℹ️ General Cleaning hari ini sudah terisi 2 orang.');
                return;
            }
            const sent = await bot.sendMessage(Number(groupChatId), messages_js_1.default.getGeneralCleaningPromptMessage(), { reply_markup: keyboard_js_1.default.createGeneralCleaningKeyboard() });
            await bot.sendMessage(chatId, '✅ Permintaan General Cleaning telah diposting ke grup.');
            console.log(`🧹 GC message posted: ${sent.message_id}`);
        }
        catch (error) {
            console.error('❌ Error in /general_cleaning:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal memposting ke grup'));
        }
    }
    static async handleListGaji(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !(0, auth_js_1.isPrivateChat)(msg.chat.type)) {
            await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
            return;
        }
        if (!(0, auth_js_1.isAdmin)(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        try {
            const week = scheduleService_js_1.default.getCurrentWeekRange();
            const response = await supabase_js_1.default.getWeeklyPayroll(week.start, week.end);
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal menghitung gaji'));
                return;
            }
            await bot.sendMessage(chatId, messages_js_1.default.getPayrollReportMessage(response.data || [], week));
        }
        catch (error) {
            console.error('❌ Error in /list_gaji:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleGenerateCode(bot, msg, typeArg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !(0, auth_js_1.isPrivateChat)(msg.chat.type)) {
            await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
            return;
        }
        if (!(0, auth_js_1.isAdmin)(telegramId)) {
            await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        const type = typeArg?.toLowerCase() === 'driver' ? 'driver' : 'employee';
        try {
            const response = await supabase_js_1.default.createVerificationCode(type);
            if (!response.success || !response.data) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal membuat kode'));
                return;
            }
            await bot.sendMessage(chatId, messages_js_1.default.getGeneratedCodeMessage(response.data.code, type));
        }
        catch (error) {
            console.error('❌ Error in /generate_code:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleJadwal(bot, msg) {
        const chatId = msg.chat.id;
        try {
            const week = scheduleService_js_1.default.getCurrentWeekRange();
            const response = await supabase_js_1.default.getSchedulesForWeek(week.start, week.end);
            if (!response.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil jadwal'));
                return;
            }
            const schedules = response.data || [];
            if (schedules.length === 0) {
                await bot.sendMessage(chatId, messages_js_1.default.getEmptyScheduleMessage());
                return;
            }
            const message = messages_js_1.default.getFullWeeklyScheduleMessage(schedules, week);
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            console.error('❌ Error in /jadwal:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleTukarJadwal(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId || !(0, auth_js_1.isPrivateChat)(msg.chat.type)) {
            await bot.sendMessage(chatId, '⛔ Request tukar jadwal hanya bisa dilakukan melalui chat pribadi dengan bot.');
            return;
        }
        try {
            const employeeRes = await supabase_js_1.default.getEmployeeByTelegramId(telegramId);
            if (!employeeRes.success || !employeeRes.data) {
                await bot.sendMessage(chatId, messages_js_1.default.getNotRegisteredMessage());
                return;
            }
            const week = scheduleService_js_1.default.getCurrentWeekRange();
            const schedulesRes = await supabase_js_1.default.getSchedulesForWeek(week.start, week.end);
            if (!schedulesRes.success || !schedulesRes.data) {
                await bot.sendMessage(chatId, '❌ Gagal mengambil data jadwal.');
                return;
            }
            // Filter jadwal yang hanya milik karyawan ini
            const myShifts = schedulesRes.data.filter(s => s.employee_id === employeeRes.data?.id);
            if (myShifts.length === 0) {
                await bot.sendMessage(chatId, '📅 Anda tidak memiliki shift yang tercatat untuk minggu ini.');
                return;
            }
            await bot.sendMessage(chatId, messages_js_1.default.getSelectShiftToSwapMessage(), {
                reply_markup: keyboard_js_1.default.createMyShiftsKeyboard(myShifts)
            });
        }
        catch (error) {
            console.error('❌ Error in /tukar_jadwal:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleTextMessage(bot, msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        const text = msg.text;
        if (!telegramId || !text || text.startsWith('/'))
            return;
        if (sessionManager_js_1.default.isInEmployeeFlow(telegramId)) {
            await this.handleEmployeeTextFlow(bot, chatId, telegramId, text);
            return;
        }
        if (sessionManager_js_1.default.isInAdminScheduleFlow(telegramId)) {
            await this.handleShiftLimitInput(bot, chatId, telegramId, text);
        }
    }
    static async handleEmployeeTextFlow(bot, chatId, telegramId, text) {
        const state = sessionManager_js_1.default.getEmployeeState(telegramId);
        try {
            switch (state) {
                case 'waiting_employee_name':
                    await this.handleEmployeeNameInput(bot, chatId, telegramId, text);
                    break;
                case 'waiting_employee_code':
                    await this.handleEmployeeCodeInput(bot, chatId, telegramId, text);
                    break;
                case 'waiting_employee_wa':
                    await this.handleEmployeeWaInput(bot, chatId, telegramId, text);
                    break;
                case 'waiting_rekening':
                    await this.handleRekeningInput(bot, chatId, telegramId, text);
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            console.error('❌ Error in employee text flow:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan sistem'));
        }
    }
    static async handleEmployeeNameInput(bot, chatId, telegramId, name) {
        if (name.trim().length < 2) {
            await bot.sendMessage(chatId, '❌ Nama terlalu pendek. Silakan masukkan nama lengkap Anda:');
            return;
        }
        sessionManager_js_1.default.updateSessionData(telegramId, { name: name.trim() });
        sessionManager_js_1.default.setSession(telegramId, 'employee', 'waiting_employee_code');
        await bot.sendMessage(chatId, messages_js_1.default.getEmployeeCodeMessage());
    }
    static async handleEmployeeCodeInput(bot, chatId, telegramId, code) {
        const employeeCode = code.trim().toUpperCase();
        const codeResponse = await supabase_js_1.default.validateVerificationCode(employeeCode, 'employee');
        if (!codeResponse.success) {
            await bot.sendMessage(chatId, messages_js_1.default.getInvalidEmployeeCodeMessage());
            return;
        }
        sessionManager_js_1.default.updateSessionData(telegramId, { employeeCode });
        sessionManager_js_1.default.setSession(telegramId, 'employee', 'waiting_employee_wa');
        await bot.sendMessage(chatId, messages_js_1.default.getWhatsAppMessage());
    }
    static async handleEmployeeWaInput(bot, chatId, telegramId, phone) {
        if (!messages_js_1.default.isValidPhoneNumber(phone)) {
            await bot.sendMessage(chatId, messages_js_1.default.getInvalidWhatsAppMessage());
            return;
        }
        const formattedPhone = messages_js_1.default.formatPhoneNumber(phone);
        sessionManager_js_1.default.updateSessionData(telegramId, { whatsapp: formattedPhone });
        sessionManager_js_1.default.setSession(telegramId, 'employee', 'waiting_rekening');
        await bot.sendMessage(chatId, messages_js_1.default.getRekeningPromptMessage());
    }
    static async handleRekeningInput(bot, chatId, telegramId, rekening) {
        if (rekening.trim().length < 3) {
            await bot.sendMessage(chatId, '❌ Info rekening/e-wallet terlalu pendek. Contoh: BNI 123456 atau Gopay 0812...');
            return;
        }
        const sessionData = sessionManager_js_1.default.getSessionData(telegramId);
        if (!sessionData?.name || !sessionData.employeeCode || !sessionData.whatsapp) {
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Data registrasi tidak lengkap'));
            return;
        }
        const createResponse = await supabase_js_1.default.createEmployee({
            telegram_id: telegramId,
            nama: sessionData.name,
            no_wa: sessionData.whatsapp,
            rekening_info: rekening.trim(),
            is_verified: true,
        });
        if (!createResponse.success) {
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal menyimpan data karyawan'));
            return;
        }
        await supabase_js_1.default.markVerificationCodeAsUsed(sessionData.employeeCode);
        sessionManager_js_1.default.clearSession(telegramId);
        await bot.sendMessage(chatId, messages_js_1.default.getEmployeeRegistrationCompleteMessage(createResponse.data));
    }
    static async handleShiftLimitInput(bot, chatId, telegramId, text) {
        const limit = parseInt(text.trim(), 10);
        if (isNaN(limit) || limit < 1 || limit > 14) {
            await bot.sendMessage(chatId, '❌ Masukkan angka valid (1-14) untuk batas shift per orang:');
            return;
        }
        sessionManager_js_1.default.clearSession(telegramId);
        await bot.sendMessage(chatId, '⏳ Sedang membuat jadwal mingguan...');
        try {
            const week = scheduleService_js_1.default.getCurrentWeekRange();
            const employeesRes = await supabase_js_1.default.getVerifiedEmployees();
            if (!employeesRes.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal mengambil data karyawan'));
                return;
            }
            const generated = scheduleService_js_1.default.generateWeeklySchedule(employeesRes.data || [], limit, week.dates);
            if (!generated) {
                await bot.sendMessage(chatId, messages_js_1.default.getScheduleGenerationFailedMessage(limit, employeesRes.data?.length || 0));
                return;
            }
            const saveRes = await supabase_js_1.default.replaceWeekSchedules(week.start, week.end, generated);
            if (!saveRes.success) {
                await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Gagal menyimpan jadwal'));
                return;
            }
            await bot.sendMessage(chatId, messages_js_1.default.getScheduleCreatedMessage(generated.length, limit));
            const groupChatId = index_js_1.config.employeeGroupChatId;
            if (groupChatId && saveRes.data) {
                const scheduleMessage = messages_js_1.default.getFullWeeklyScheduleMessage(saveRes.data, week);
                await bot.sendMessage(Number(groupChatId), scheduleMessage, { parse_mode: 'Markdown' });
            }
        }
        catch (error) {
            console.error('❌ Error generating schedule:', error);
            await bot.sendMessage(chatId, messages_js_1.default.getErrorMessage('Terjadi kesalahan saat membuat jadwal'));
        }
    }
}
exports.EmployeeHandlers = EmployeeHandlers;
exports.default = EmployeeHandlers;
//# sourceMappingURL=employeeHandlers.js.map