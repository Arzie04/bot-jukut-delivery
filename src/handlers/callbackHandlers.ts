import TelegramBot from 'node-telegram-bot-api';
import SupabaseService from '../services/supabase';
import SpreadsheetService from '../services/spreadsheet';
import DriverStatusSyncService from '../services/driverStatusSync';
import OrderNotifierService from '../services/orderNotifier';
import CommandHandlers from './commandHandlers';
import sessionManager from '../state/sessionManager';
import MessageUtils from '../utils/messages';
import KeyboardUtils from '../utils/keyboard';
import { CallbackData, DriverStatus } from '../types';

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
      const orderStillActive = activeBefore.data?.find((o) => o.order_code === orderId);
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