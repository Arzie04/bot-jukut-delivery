import type TelegramBot from 'node-telegram-bot-api';
import SupabaseService from '../services/supabase.js';
import ScheduleService from '../services/scheduleService.js';
import sessionManager from '../state/sessionManager.js';
import MessageUtils from '../utils/messages.js';
import KeyboardUtils from '../utils/keyboard.js';
import { isAdmin, isPrivateChat } from '../utils/auth.js';
import { config } from '../config/index.js';
import type { Schedule } from '../types/index.js';

export class EmployeeHandlers {
  static async handleRegistKaryawan(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId || !isPrivateChat(msg.chat.type)) {
      if (telegramId) {
        await bot.sendMessage(chatId, '⛔ Registrasi karyawan hanya bisa dilakukan di chat pribadi dengan bot.');
      }
      return;
    }

    try {
      const existing = await SupabaseService.getEmployeeByTelegramId(telegramId);
      if (existing.success && existing.data) {
        await bot.sendMessage(chatId, MessageUtils.getEmployeeAlreadyRegisteredMessage());
        return;
      }

      sessionManager.setSession(telegramId, 'employee', 'waiting_employee_name');
      await bot.sendMessage(chatId, MessageUtils.getEmployeeRegistrationStartMessage());
    } catch (error) {
      console.error('❌ Error in /regist_karyawan:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  static async handleBuatJadwal(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId || !isPrivateChat(msg.chat.type)) {
      await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
      return;
    }

    if (!isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    sessionManager.setSession(telegramId, 'admin_schedule', 'waiting_shift_limit');
    await bot.sendMessage(chatId, MessageUtils.getShiftLimitPromptMessage());
  }

  static async handleGeneralCleaning(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId || !isPrivateChat(msg.chat.type)) {
      await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
      return;
    }

    if (!isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    const groupChatId = config.employeeGroupChatId;
    if (!groupChatId) {
      await bot.sendMessage(chatId, '❌ EMPLOYEE_GROUP_CHAT_ID belum dikonfigurasi di environment.');
      return;
    }

    try {
      const today = ScheduleService.formatDate(new Date());
      const countRes = await SupabaseService.countGeneralCleaningForDate(today);
      if (countRes.success && (countRes.data || 0) >= 2) {
        await bot.sendMessage(chatId, 'ℹ️ General Cleaning hari ini sudah terisi 2 orang.');
        return;
      }

      const sent = await bot.sendMessage(
        Number(groupChatId),
        MessageUtils.getGeneralCleaningPromptMessage(),
        { reply_markup: KeyboardUtils.createGeneralCleaningKeyboard() }
      );

      await bot.sendMessage(chatId, '✅ Permintaan General Cleaning telah diposting ke grup.');
      console.log(`🧹 GC message posted: ${sent.message_id}`);
    } catch (error) {
      console.error('❌ Error in /general_cleaning:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal memposting ke grup'));
    }
  }

  static async handleListGaji(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId || !isPrivateChat(msg.chat.type)) {
      await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
      return;
    }

    if (!isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    try {
      const week = ScheduleService.getCurrentWeekRange();
      const response = await SupabaseService.getWeeklyPayroll(week.start, week.end);
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal menghitung gaji'));
        return;
      }

      await bot.sendMessage(chatId, MessageUtils.getPayrollReportMessage(response.data || [], week));
    } catch (error) {
      console.error('❌ Error in /list_gaji:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  static async handleGenerateCode(bot: TelegramBot, msg: TelegramBot.Message, typeArg?: string): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId || !isPrivateChat(msg.chat.type)) {
      await bot.sendMessage(chatId, '⛔ Perintah ini hanya untuk admin di chat pribadi.');
      return;
    }

    if (!isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    const type = typeArg?.toLowerCase() === 'driver' ? 'driver' : 'employee';

    try {
      const response = await SupabaseService.createVerificationCode(type);
      if (!response.success || !response.data) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal membuat kode'));
        return;
      }

      await bot.sendMessage(chatId, MessageUtils.getGeneratedCodeMessage(response.data.code, type));
    } catch (error) {
      console.error('❌ Error in /generate_code:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  static async handleJadwal(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const week = ScheduleService.getCurrentWeekRange();
      const response = await SupabaseService.getSchedulesForWeek(week.start, week.end);
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil jadwal'));
        return;
      }

      const schedules = response.data || [];
      if (schedules.length === 0) {
        await bot.sendMessage(chatId, MessageUtils.getEmptyScheduleMessage());
        return;
      }

      await this.sendScheduleMessages(bot, chatId, schedules, week);
    } catch (error) {
      console.error('❌ Error in /jadwal:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  static async sendScheduleMessages(
    bot: TelegramBot,
    chatId: number,
    schedules: Schedule[],
    week: { start: string; end: string; dates: string[] }
  ): Promise<void> {
    const header = MessageUtils.getScheduleHeaderMessage(week);
    await bot.sendMessage(chatId, header);

    const grouped = ScheduleService.groupSchedulesByDayShift(schedules);

    for (const tanggal of week.dates) {
      for (const shift of ['pagi', 'siang'] as const) {
        const key = `${tanggal}:${shift}`;
        const slots = grouped.get(key) || [];
        if (slots.length === 0) continue;

        const names = slots
          .map((s) => ScheduleService.getEmployeeFromSchedule(s)?.nama || '—')
          .join(' & ');

        const message = `📆 *${ScheduleService.getDayName(tanggal)}, ${ScheduleService.formatDateDisplay(tanggal)}*\n${ScheduleService.getShiftLabel(shift)}: ${names}`;

        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: KeyboardUtils.createScheduleSwapKeyboard(slots),
        });
      }
    }
  }

  static async handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    const text = msg.text;

    if (!telegramId || !text || text.startsWith('/')) return;

    if (sessionManager.isInEmployeeFlow(telegramId)) {
      await this.handleEmployeeTextFlow(bot, chatId, telegramId, text);
      return;
    }

    if (sessionManager.isInAdminScheduleFlow(telegramId)) {
      await this.handleShiftLimitInput(bot, chatId, telegramId, text);
    }
  }

  private static async handleEmployeeTextFlow(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    text: string
  ): Promise<void> {
    const state = sessionManager.getEmployeeState(telegramId);

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
    } catch (error) {
      console.error('❌ Error in employee text flow:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  private static async handleEmployeeNameInput(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    name: string
  ): Promise<void> {
    if (name.trim().length < 2) {
      await bot.sendMessage(chatId, '❌ Nama terlalu pendek. Silakan masukkan nama lengkap Anda:');
      return;
    }

    sessionManager.updateSessionData(telegramId, { name: name.trim() });
    sessionManager.setSession(telegramId, 'employee', 'waiting_employee_code');
    await bot.sendMessage(chatId, MessageUtils.getEmployeeCodeMessage());
  }

  private static async handleEmployeeCodeInput(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    code: string
  ): Promise<void> {
    const employeeCode = code.trim().toUpperCase();
    const codeResponse = await SupabaseService.validateVerificationCode(employeeCode, 'employee');

    if (!codeResponse.success) {
      await bot.sendMessage(chatId, MessageUtils.getInvalidEmployeeCodeMessage());
      return;
    }

    sessionManager.updateSessionData(telegramId, { employeeCode });
    sessionManager.setSession(telegramId, 'employee', 'waiting_employee_wa');
    await bot.sendMessage(chatId, MessageUtils.getWhatsAppMessage());
  }

  private static async handleEmployeeWaInput(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    phone: string
  ): Promise<void> {
    if (!MessageUtils.isValidPhoneNumber(phone)) {
      await bot.sendMessage(chatId, MessageUtils.getInvalidWhatsAppMessage());
      return;
    }

    const formattedPhone = MessageUtils.formatPhoneNumber(phone);
    sessionManager.updateSessionData(telegramId, { whatsapp: formattedPhone });
    sessionManager.setSession(telegramId, 'employee', 'waiting_rekening');
    await bot.sendMessage(chatId, MessageUtils.getRekeningPromptMessage());
  }

  private static async handleRekeningInput(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    rekening: string
  ): Promise<void> {
    if (rekening.trim().length < 3) {
      await bot.sendMessage(chatId, '❌ Info rekening/e-wallet terlalu pendek. Contoh: BNI 123456 atau Gopay 0812...');
      return;
    }

    const sessionData = sessionManager.getSessionData(telegramId);
    if (!sessionData?.name || !sessionData.employeeCode || !sessionData.whatsapp) {
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Data registrasi tidak lengkap'));
      return;
    }

    const createResponse = await SupabaseService.createEmployee({
      telegram_id: telegramId,
      nama: sessionData.name,
      no_wa: sessionData.whatsapp,
      rekening_info: rekening.trim(),
      is_verified: true,
    });

    if (!createResponse.success) {
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal menyimpan data karyawan'));
      return;
    }

    await SupabaseService.markVerificationCodeAsUsed(sessionData.employeeCode);
    sessionManager.clearSession(telegramId);

    await bot.sendMessage(chatId, MessageUtils.getEmployeeRegistrationCompleteMessage(createResponse.data!));
  }

  private static async handleShiftLimitInput(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    text: string
  ): Promise<void> {
    const limit = parseInt(text.trim(), 10);
    if (isNaN(limit) || limit < 1 || limit > 14) {
      await bot.sendMessage(chatId, '❌ Masukkan angka valid (1-14) untuk batas shift per orang:');
      return;
    }

    sessionManager.clearSession(telegramId);
    await bot.sendMessage(chatId, '⏳ Sedang membuat jadwal mingguan...');

    try {
      const week = ScheduleService.getCurrentWeekRange();
      const employeesRes = await SupabaseService.getVerifiedEmployees();
      if (!employeesRes.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil data karyawan'));
        return;
      }

      const generated = ScheduleService.generateWeeklySchedule(
        employeesRes.data || [],
        limit,
        week.dates
      );

      if (!generated) {
        await bot.sendMessage(
          chatId,
          MessageUtils.getScheduleGenerationFailedMessage(limit, employeesRes.data?.length || 0)
        );
        return;
      }

      const saveRes = await SupabaseService.replaceWeekSchedules(week.start, week.end, generated);
      if (!saveRes.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal menyimpan jadwal'));
        return;
      }

      await bot.sendMessage(chatId, MessageUtils.getScheduleCreatedMessage(generated.length, limit));

      const groupChatId = config.employeeGroupChatId;
      if (groupChatId && saveRes.data) {
        await this.sendScheduleMessages(bot, Number(groupChatId), saveRes.data, week);
      }
    } catch (error) {
      console.error('❌ Error generating schedule:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan saat membuat jadwal'));
    }
  }
}

export default EmployeeHandlers;
