import type TelegramBot from 'node-telegram-bot-api';
import SupabaseService from '../services/supabase.js';
import SpreadsheetService from '../services/spreadsheet.js';
import DriverStatusSyncService from '../services/driverStatusSync.js';
import OrderNotifierService from '../services/orderNotifier.js';
import CommandHandlers from './commandHandlers.js';
import sessionManager from '../state/sessionManager.js';
import MessageUtils from '../utils/messages.js';
import KeyboardUtils from '../utils/keyboard.js';
import type { CallbackData, DeliveryOrder, DriverStatus, Schedule } from '../types/index.js';
import ScheduleService from '../services/scheduleService.js';

export class CallbackHandlers {
  // Handle callback queries (inline keyboard button clicks)
  static async handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery): Promise<void> {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const telegramId = query.from.id.toString();
    const callbackData = query.data;

    if (!chatId || !callbackData) return;

    console.log(`🔘 Callback query from ${telegramId}: ${callbackData}`);

    try {
      // Parse callback data
      const data = KeyboardUtils.parseCallbackData(callbackData);
      if (!data) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Data tidak valid' });
        return;
      }

      // Handle different callback actions
      switch (data.action) {
        case 'set_status':
          await this.handleSetStatus(bot, query, telegramId, data.status!);
          break;
        case 'take_order':
          await this.handleTakeOrder(bot, query, telegramId, data.orderId!);
          break;
        case 'start_delivery':
          await this.handleStartDelivery(bot, query, telegramId, data.orderId!);
          break;
        case 'complete_delivery':
          await this.handleCompleteDelivery(bot, query, telegramId, data.orderId!);
          break;
        case 'view_active_orders':
          await CommandHandlers.handleActiveOrders(bot, {
            ...query.message!,
            from: query.from,
          } as TelegramBot.Message);
          await bot.answerCallbackQuery(query.id);
          break;
        case 'request_swap':
          await this.handleRequestSwap(bot, query, telegramId, data.scheduleId!);
          break;
        case 'take_shift':
          await this.handleTakeShift(bot, query, telegramId, data.swapRequestId!);
          break;
        case 'swap_shift':
          await this.handleSwapShift(bot, query, telegramId, data.swapRequestId!);
          break;
        case 'take_gc':
          await this.handleTakeGeneralCleaning(bot, query, telegramId);
          break;
        default:
          await bot.answerCallbackQuery(query.id, { text: '❌ Aksi tidak dikenal' });
          break;
      }
    } catch (error) {
      console.error('❌ Error handling callback query:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  // Handle initial status selection during registration
  private static async handleSetStatus(bot: TelegramBot, query: TelegramBot.CallbackQuery, telegramId: string, status: DriverStatus): Promise<void> {
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;

    try {
      // Check if user is in registration flow
      if (!sessionManager.isInRegistrationFlow(telegramId)) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Sesi registrasi tidak valid' });
        return;
      }

      // Get session data
      const sessionData = sessionManager.getSessionData(telegramId);
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

      const createResponse = await SupabaseService.createDriver(driverData);
      
      if (!createResponse.success) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Gagal menyimpan data driver' });
        return;
      }

      // Mark driver code as used
      await SupabaseService.markDriverCodeAsUsed(sessionData.driverCode, createResponse.data?.id);

      // Clear session
      sessionManager.clearSession(telegramId);

      // Send completion message
      const completionMessage = MessageUtils.getRegistrationCompleteMessage(createResponse.data!);
      
      // Edit the message to remove keyboard
      await bot.editMessageText(completionMessage, {
        chat_id: chatId,
        message_id: messageId,
      });

      await bot.sendMessage(chatId, 'Silakan gunakan tombol menu driver yang tersedia.', {
        reply_markup: KeyboardUtils.createDriverMainMenuKeyboard(),
      });

      await bot.answerCallbackQuery(query.id, { text: '✅ Registrasi berhasil!' });
    } catch (error) {
      console.error('❌ Error in handleSetStatus:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  // Handle taking an order
  private static async handleTakeOrder(bot: TelegramBot, query: TelegramBot.CallbackQuery, telegramId: string, orderId: string): Promise<void> {
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;

    try {
      // Check if driver is registered and in standby status
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      
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
      const activeOrdersResponse = await SupabaseService.getDriverActiveOrders(driver.id!);
      const activeCount = activeOrdersResponse.data?.length || 0;

      if (activeCount >= 5) {
        await bot.answerCallbackQuery(query.id, { text: 'Maksimal 5 pesanan aktif tercapai', show_alert: true });
        return;
      }

      // Try to assign order to driver
      const assignResponse = await SupabaseService.assignOrderToDriver(orderId, driver.id!);
      
      if (!assignResponse.success) {
        await bot.answerCallbackQuery(query.id, { text: assignResponse.error || '❌ Gagal mengambil order' });
        return;
      }

      await OrderNotifierService.markOrderTaken(bot, orderId, telegramId);

      // Driver tetap standby sampai klik Mulai Antar
      await DriverStatusSyncService.syncFromActiveOrders(telegramId, driver.id!);

      const sheetResult = await SpreadsheetService.syncOrderStatus(
        assignResponse.data!.order_code,
        'order_assigned',
        driver,
        { previousStatus: 'disiapkan-printed' }
      );
      if (!sheetResult.success) {
        console.error(`❌ Spreadsheet sync failed (assigned):`, sheetResult);
      }

      // Send success message with new keyboard
      const assignedMessage = MessageUtils.getOrderAssignedMessage(assignResponse.data!);
      
      await bot.editMessageText(assignedMessage, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: KeyboardUtils.createDeliveryKeyboard(orderId),
      });

      await bot.answerCallbackQuery(query.id, { text: '✅ Order berhasil diambil!' });
    } catch (error) {
      console.error('❌ Error in handleTakeOrder:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  // Handle starting delivery
  private static async handleStartDelivery(bot: TelegramBot, query: TelegramBot.CallbackQuery, telegramId: string, orderId: string): Promise<void> {
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;

    try {
      // Check if driver is registered and has assigned status
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      
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
      const orderResponse = await SupabaseService.updateOrderStatus(orderId, 'delivering');
      
      if (!orderResponse.success) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Gagal memulai delivery' });
        return;
      }

      await DriverStatusSyncService.syncFromActiveOrders(telegramId, driver.id!);

      const sheetResult = await SpreadsheetService.syncOrderStatus(
        orderResponse.data!.order_code,
        'order_delivering',
        driver,
        { previousStatus: 'assigned' }
      );
      if (!sheetResult.success) {
        console.error(`❌ Spreadsheet sync failed (delivering):`, sheetResult);
      }

      // Send delivery started message with complete keyboard
      const deliveryMessage = MessageUtils.getDeliveryStartedMessage(orderResponse.data!);
      
      await bot.editMessageText(deliveryMessage, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: KeyboardUtils.createCompleteKeyboard(orderId),
      });

      await bot.answerCallbackQuery(query.id, { text: '🚀 Delivery dimulai!' });
    } catch (error) {
      console.error('❌ Error in handleStartDelivery:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  private static async handleRequestSwap(
    bot: TelegramBot,
    query: TelegramBot.CallbackQuery,
    telegramId: string,
    scheduleId: number
  ): Promise<void> {
    const chatId = query.message!.chat.id;

    try {
      const employeeRes = await SupabaseService.getEmployeeByTelegramId(telegramId);
      if (!employeeRes.success || !employeeRes.data?.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
        return;
      }

      const scheduleRes = await SupabaseService.getScheduleById(scheduleId);
      if (!scheduleRes.success || !scheduleRes.data) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Jadwal tidak ditemukan' });
        return;
      }

      const schedule = scheduleRes.data;
      if (schedule.employee_id !== employeeRes.data.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Anda bukan pemilik shift ini' });
        return;
      }

      const swapRes = await SupabaseService.createSwapRequest(scheduleId, employeeRes.data.id);
      if (!swapRes.success || !swapRes.data?.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Gagal membuat permintaan tukar' });
        return;
      }

      const dayName = ScheduleService.getDayName(schedule.tanggal);
      const dateDisplay = ScheduleService.formatDateDisplay(schedule.tanggal);
      const shiftLabel = schedule.shift === 'pagi' ? 'Pagi' : 'Siang';

      await bot.sendMessage(
        chatId,
        MessageUtils.getSwapRequestMessage(employeeRes.data.nama, dayName, dateDisplay, shiftLabel),
        {
          parse_mode: 'HTML',
          reply_markup: KeyboardUtils.createSwapActionKeyboard(swapRes.data.id),
        }
      );

      await bot.answerCallbackQuery(query.id, { text: '✅ Permintaan tukar diposting' });
    } catch (error) {
      console.error('❌ Error in handleRequestSwap:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  private static async handleTakeShift(
    bot: TelegramBot,
    query: TelegramBot.CallbackQuery,
    telegramId: string,
    swapRequestId: number
  ): Promise<void> {
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;

    try {
      const takerRes = await SupabaseService.getEmployeeByTelegramId(telegramId);
      if (!takerRes.success || !takerRes.data?.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
        return;
      }

      const swapRes = await SupabaseService.getSwapRequestById(swapRequestId);
      if (!swapRes.success || !swapRes.data || swapRes.data.status !== 'open') {
        await bot.answerCallbackQuery(query.id, { text: '❌ Permintaan sudah tidak aktif' });
        return;
      }

      if (swapRes.data.requester_id === takerRes.data.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Tidak bisa mengambil shift sendiri' });
        return;
      }

      const scheduleRes = await SupabaseService.getScheduleById(swapRes.data.schedule_id);
      if (!scheduleRes.success || !scheduleRes.data) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Jadwal tidak ditemukan' });
        return;
      }

      const updateRes = await SupabaseService.updateScheduleEmployee(
        swapRes.data.schedule_id,
        takerRes.data.id
      );
      if (!updateRes.success) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Gagal mengambil shift' });
        return;
      }

      await SupabaseService.completeSwapRequest(swapRequestId);

      const dayName = ScheduleService.getDayName(scheduleRes.data.tanggal);
      const shiftLabel = scheduleRes.data.shift === 'pagi' ? 'Pagi' : 'Siang';

      await bot.editMessageText(
        MessageUtils.getSwapTakenMessage(takerRes.data.nama, dayName, shiftLabel),
        { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' }
      );

      await bot.answerCallbackQuery(query.id, { text: '✅ Shift berhasil diambil!' });
    } catch (error) {
      console.error('❌ Error in handleTakeShift:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  private static async handleSwapShift(
    bot: TelegramBot,
    query: TelegramBot.CallbackQuery,
    telegramId: string,
    swapRequestId: number
  ): Promise<void> {
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;

    try {
      const swapperRes = await SupabaseService.getEmployeeByTelegramId(telegramId);
      if (!swapperRes.success || !swapperRes.data?.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
        return;
      }

      const swapRes = await SupabaseService.getSwapRequestById(swapRequestId);
      if (!swapRes.success || !swapRes.data || swapRes.data.status !== 'open') {
        await bot.answerCallbackQuery(query.id, { text: '❌ Permintaan sudah tidak aktif' });
        return;
      }

      if (swapRes.data.requester_id === swapperRes.data.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Tidak bisa tukar dengan diri sendiri' });
        return;
      }

      const requesterScheduleRes = await SupabaseService.getScheduleById(swapRes.data.schedule_id);
      if (!requesterScheduleRes.success || !requesterScheduleRes.data) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Jadwal tidak ditemukan' });
        return;
      }

      const today = ScheduleService.formatDate(new Date());
      const swapperSchedulesRes = await SupabaseService.getEmployeeFutureSchedules(
        swapperRes.data.id,
        today
      );
      const swapperSchedules = (swapperSchedulesRes.data || []).filter(
        (s: Schedule) => s.id !== swapRes.data!.schedule_id
      );

      if (swapperSchedules.length === 0) {
        await bot.answerCallbackQuery(query.id, {
          text: '❌ Anda tidak punya jadwal mendatang untuk ditukar',
          show_alert: true,
        });
        return;
      }

      const swapperSchedule = swapperSchedules[0]!;

      await SupabaseService.updateScheduleEmployee(swapRes.data.schedule_id, swapperRes.data.id);
      await SupabaseService.updateScheduleEmployee(swapperSchedule.id!, swapRes.data.requester_id);
      await SupabaseService.completeSwapRequest(swapRequestId);

      const requesterRes = await SupabaseService.getEmployeeById(swapRes.data.requester_id);
      const requesterName = requesterRes.data?.nama || 'Karyawan';

      await bot.editMessageText(
        MessageUtils.getSwapCompletedMessage(requesterName, swapperRes.data.nama),
        { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' }
      );

      await bot.answerCallbackQuery(query.id, { text: '🔁 Tukar jadwal berhasil!' });
    } catch (error) {
      console.error('❌ Error in handleSwapShift:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  private static async handleTakeGeneralCleaning(
    bot: TelegramBot,
    query: TelegramBot.CallbackQuery,
    telegramId: string
  ): Promise<void> {
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;

    try {
      const employeeRes = await SupabaseService.getEmployeeByTelegramId(telegramId);
      if (!employeeRes.success || !employeeRes.data?.id) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai karyawan' });
        return;
      }

      const today = ScheduleService.formatDate(new Date());

      const alreadyTaken = await SupabaseService.hasEmployeeTakenGcOnDate(employeeRes.data.id, today);
      if (alreadyTaken.success && alreadyTaken.data) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Anda sudah terdaftar GC hari ini' });
        return;
      }

      const countRes = await SupabaseService.countGeneralCleaningForDate(today);
      if (countRes.success && (countRes.data || 0) >= 2) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Slot General Cleaning sudah penuh' });
        return;
      }

      const logRes = await SupabaseService.createGeneralCleaningLog(today, employeeRes.data.id);
      if (!logRes.success) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Gagal mendaftar GC' });
        return;
      }

      const newCount = (countRes.data || 0) + 1;
      const logsRes = await SupabaseService.getGeneralCleaningLogsForWeek(today, today);
      const names = (logsRes.data || [])
        .map((log) => {
          const emp = Array.isArray(log.employees) ? log.employees[0] : log.employees;
          return emp?.nama || employeeRes.data!.nama;
        })
        .filter(Boolean);

      if (newCount >= 2) {
        await bot.editMessageText(MessageUtils.getGeneralCleaningTakenMessage(names), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
        });
      } else {
        await bot.answerCallbackQuery(query.id, { text: `✅ ${employeeRes.data.nama} terdaftar GC (${newCount}/2)` });
      }
    } catch (error) {
      console.error('❌ Error in handleTakeGeneralCleaning:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }

  // Handle completing delivery
  private static async handleCompleteDelivery(bot: TelegramBot, query: TelegramBot.CallbackQuery, telegramId: string, orderId: string): Promise<void> {
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;

    try {
      // Check if driver is registered and has delivering status
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      
      if (!driverResponse.success || !driverResponse.data) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Anda belum terdaftar sebagai driver' });
        return;
      }

      const driver = driverResponse.data;

      const activeBefore = await SupabaseService.getDriverActiveOrders(driver.id!);
      const orderStillActive = activeBefore.data?.find((o: DeliveryOrder) => o.order_code === orderId);
      if (!orderStillActive || orderStillActive.status !== 'delivering') {
        await bot.answerCallbackQuery(query.id, { text: '❌ Pesanan belum dalam status pengantaran' });
        return;
      }

      const orderResponse = await SupabaseService.updateOrderStatus(orderId, 'completed');
      
      if (!orderResponse.success) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Gagal menyelesaikan delivery' });
        return;
      }

      await DriverStatusSyncService.syncFromActiveOrders(telegramId, driver.id!);

      const sheetResult = await SpreadsheetService.syncOrderStatus(
        orderResponse.data!.order_code,
        'order_completed',
        driver,
        { previousStatus: 'delivering' }
      );
      if (!sheetResult.success) {
        console.error(`❌ Spreadsheet sync failed (completed):`, sheetResult);
      }

      // Send completion message (remove keyboard)
      const completionMessage = MessageUtils.getDeliveryCompletedMessage(orderResponse.data!);
      
      await bot.editMessageText(completionMessage, {
        chat_id: chatId,
        message_id: messageId,
      });

      await bot.answerCallbackQuery(query.id, { text: '🎉 Delivery selesai!' });
    } catch (error) {
      console.error('❌ Error in handleCompleteDelivery:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan sistem' });
    }
  }
}

export default CallbackHandlers;
