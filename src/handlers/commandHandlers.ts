import type TelegramBot from 'node-telegram-bot-api';
import SupabaseService from '../services/supabase.js';
import sessionManager from '../state/sessionManager.js';
import MessageUtils from '../utils/messages.js';
import KeyboardUtils from '../utils/keyboard.js';
import type { DriverStatus } from '../types/index.js';
import EmployeeHandlers from './employeeHandlers.js';

export class CommandHandlers {
  private static isAdmin(telegramId: string): boolean {
    const raw = process.env.ADMIN_TELEGRAM_IDS || '';
    const ids = raw.split(',').map((id) => id.trim()).filter(Boolean);
    return ids.includes(telegramId);
  }

  private static async getDynamicDriverKeyboard(telegramId: string) {
    const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
    return driverResponse.success && driverResponse.data
      ? KeyboardUtils.createDriverMainMenuKeyboard()
      : KeyboardUtils.createUnregisteredKeyboard();
  }

  // Handle /start command
  static async handleStart(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) return;

    console.log(`📱 /start command from ${telegramId}`);

    try {
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      if (driverResponse.success && driverResponse.data) {
        await bot.sendMessage(chatId, MessageUtils.getAlreadyRegisteredMessage(), {
          reply_markup: KeyboardUtils.createDriverMainMenuKeyboard(),
        });
        return;
      }

      await bot.sendMessage(chatId, MessageUtils.getWelcomeMessage(), {
        reply_markup: KeyboardUtils.createUnregisteredKeyboard(),
      });
    } catch (error) {
      console.error('❌ Error in /start handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  // Handle /regist_driver command
  static async handleRegistDriver(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) return;

    console.log(`📝 /regist_driver command from ${telegramId}`);

    try {
      // Check if user is already registered
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      
      if (driverResponse.success && driverResponse.data) {
        await bot.sendMessage(chatId, MessageUtils.getAlreadyRegisteredMessage(), {
          reply_markup: KeyboardUtils.createDriverMainMenuKeyboard(),
        });
        return;
      }

      // Start registration flow
      sessionManager.setSession(telegramId, 'driver', 'waiting_name');
      await bot.sendMessage(chatId, MessageUtils.getRegistrationStartMessage());
    } catch (error) {
      console.error('❌ Error in /regist_driver handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  // Handle /status command
  static async handleStatus(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) return;

    console.log(`📊 /status command from ${telegramId}`);

    try {
      // Get driver data
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      
      if (!driverResponse.success || !driverResponse.data) {
        await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage(), {
          reply_markup: KeyboardUtils.createUnregisteredKeyboard(),
        });
        return;
      }

      const driver = driverResponse.data;

      // Get driver statistics
      const statsResponse = await SupabaseService.getDriverStats(driver.id!);
      
      if (!statsResponse.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil statistik'));
        return;
      }

      // Get active orders list
      const activeOrdersResponse = await SupabaseService.getDriverActiveOrders(driver.id!);
      const activeOrders = activeOrdersResponse.data || [];

      const stats = statsResponse.data!;
      const statusMessage = MessageUtils.getDriverStatusMessage(driver, stats, activeOrders);
      
      await bot.sendMessage(chatId, statusMessage, {
        reply_markup: KeyboardUtils.createDriverMainMenuKeyboard(),
      });
    } catch (error) {
      console.error('❌ Error in /status handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  static async handleActiveOrders(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId) return;

    try {
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      if (!driverResponse.success || !driverResponse.data || !driverResponse.data.id) {
        await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage(), {
          reply_markup: KeyboardUtils.createUnregisteredKeyboard(),
        });
        return;
      }

      const activeOrdersResponse = await SupabaseService.getDriverActiveOrders(driverResponse.data.id);
      const activeOrders = activeOrdersResponse.data || [];
      if (!activeOrders.length) {
        await bot.sendMessage(chatId, MessageUtils.getNoActiveOrdersMessage(), {
          reply_markup: KeyboardUtils.createDriverMainMenuKeyboard(),
        });
        return;
      }

      for (const order of activeOrders) {
        await bot.sendMessage(chatId, MessageUtils.getActiveOrderItemMessage(order), {
          reply_markup: KeyboardUtils.createActiveOrderActionKeyboard(order.order_code, order.status as DriverStatus),
        });
      }
    } catch (error) {
      console.error('❌ Error in /active_orders handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  // Handle /standby command
  static async handleStandby(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) return;

    console.log(`🟢 /standby command from ${telegramId}`);

    try {
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      if (!driverResponse.success || !driverResponse.data) {
        await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage(), {
          reply_markup: KeyboardUtils.createUnregisteredKeyboard(),
        });
        return;
      }

      const updateResponse = await SupabaseService.updateDriverStatus(telegramId, 'standby');
      if (!updateResponse.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengubah status'));
        return;
      }

      await bot.sendMessage(chatId, MessageUtils.getStatusUpdatedMessage('standby'), {
        reply_markup: KeyboardUtils.createDriverMainMenuKeyboard(),
      });
    } catch (error) {
      console.error('❌ Error in /standby handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  // Handle /off command
  static async handleOff(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) return;

    console.log(`🔴 /off command from ${telegramId}`);

    try {
      // Check if user is registered
      const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
      
      if (!driverResponse.success || !driverResponse.data) {
        await bot.sendMessage(chatId, MessageUtils.getNotRegisteredMessage(), {
          reply_markup: KeyboardUtils.createUnregisteredKeyboard(),
        });
        return;
      }

      // Update status to off
      const updateResponse = await SupabaseService.updateDriverStatus(telegramId, 'off');
      
      if (!updateResponse.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengubah status'));
        return;
      }

      await bot.sendMessage(chatId, MessageUtils.getStatusUpdatedMessage('off'), {
        reply_markup: KeyboardUtils.createDriverMainMenuKeyboard(),
      });
    } catch (error) {
      console.error('❌ Error in /off handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  static async handleOffAllDriver(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId) return;

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
    } catch (error) {
      console.error('❌ Error in /off_all_driver handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  // ============== ADMIN COMMANDS ==============

  static async handleAdmin(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId) return;

    if (!this.isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda bukan admin dan tidak memiliki akses ke menu ini.', {
        reply_markup: await this.getDynamicDriverKeyboard(telegramId),
      });
      return;
    }

    await bot.sendMessage(
      chatId,
      '🔐 Menu Admin\n\nDriver: /listorder, /cekpenghasilan, /bc...\nKaryawan: /buat_jadwal, /list_gaji, /general_cleaning, /generate_code\n\nSilakan pilih perintah di tombol bawah.',
      { reply_markup: KeyboardUtils.createAdminMainMenuKeyboard() }
    );
  }

  private static async _broadcastMessage(bot: TelegramBot, adminChatId: number, drivers: import('../types').Driver[], message: string, targetGroup: string) {
    if (!drivers || drivers.length === 0) {
      await bot.sendMessage(adminChatId, `🟡 Tidak ada driver dalam kelompok target (${targetGroup}) untuk dikirimi pesan.`);
      return;
    }

    const formattedMessage = MessageUtils.getAdminBroadcastMessage(message);
    let successCount = 0;
    let failureCount = 0;

    for (const driver of drivers) {
      if (driver.telegram_id) {
        try {
          await bot.sendMessage(driver.telegram_id, formattedMessage);
          successCount++;
        } catch (error: any) {
          failureCount++;
          console.error(`❌ Gagal mengirim broadcast ke ${driver.nama_driver} (${driver.telegram_id}):`, error.message);
        }
      }
    }

    await bot.sendMessage(adminChatId, `✅ Broadcast selesai.\n\n- Terkirim: ${successCount} driver\n- Gagal: ${failureCount} driver`);
  }

  static async handleListOrder(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    try {
      const response = await SupabaseService.getRecentOrders();
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil daftar order.'));
        return;
      }

      const orders = response.data || [];
      if (orders.length === 0) {
        await bot.sendMessage(chatId, MessageUtils.getNoRecentOrdersMessage());
        return;
      }

      await bot.sendMessage(chatId, `📦 Menampilkan ${orders.length} order terakhir:`);

      for (const order of orders) {
        const message = MessageUtils.getOrderListItemMessage(order);
        const keyboard = order.status === 'waiting_driver'
          ? KeyboardUtils.createOrderKeyboard(order.order_code)
          : undefined;

        await bot.sendMessage(chatId, message, {
          reply_markup: keyboard,
        });
      }
    } catch (error) {
      console.error('❌ Error in /listorder handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem saat mengambil order.'));
    }
  }

  static async handleCekPenghasilan(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    try {
      const response = await SupabaseService.getTodaysIncomeByDriver();
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil data penghasilan.'));
        return;
      }
      
      const message = MessageUtils.getDailyIncomeReportMessage(response.data || []);
      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('❌ Error in /cekpenghasilan handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem saat memeriksa penghasilan.'));
    }
  }

  static async handleListStandby(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    try {
      const response = await SupabaseService.getDriversByStatus('standby');
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil daftar driver standby.'));
        return;
      }

      await bot.sendMessage(chatId, MessageUtils.getStandbyDriversListMessage(response.data || []));
    } catch (error) {
      console.error('❌ Error in /list_standby handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem saat mengambil driver standby.'));
    }
  }

  static async handleBroadcast(bot: TelegramBot, msg: TelegramBot.Message, messageText: string): Promise<void> {
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
      const response = await SupabaseService.getAllDrivers();
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil daftar semua driver.'));
        return;
      }
      await this._broadcastMessage(bot, chatId, response.data || [], message, 'semua');
    } catch (error) {
      console.error('❌ Error in /bc handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem saat broadcast.'));
    }
  }

  static async handleBroadcastStandby(bot: TelegramBot, msg: TelegramBot.Message, messageText: string): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    const message = messageText.trim();
    if (!message) {
      await bot.sendMessage(chatId, 'Format salah. Gunakan: /bc_standby <pesan>');
      return;
    }

    try {
      const response = await SupabaseService.getDriversByStatus('standby');
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil daftar driver standby.'));
        return;
      }
      await this._broadcastMessage(bot, chatId, response.data || [], message, 'standby');
    } catch (error) {
      console.error('❌ Error in /bc_standby handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem saat broadcast.'));
    }
  }

  static async handleBroadcastOff(bot: TelegramBot, msg: TelegramBot.Message, messageText: string): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !this.isAdmin(telegramId)) {
      await bot.sendMessage(chatId, '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    const message = messageText.trim();
    if (!message) {
      await bot.sendMessage(chatId, 'Format salah. Gunakan: /bc_off <pesan>');
      return;
    }

    try {
      const response = await SupabaseService.getDriversByStatus('off');
      if (!response.success) {
        await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Gagal mengambil daftar driver off.'));
        return;
      }
      await this._broadcastMessage(bot, chatId, response.data || [], message, 'off');
    } catch (error) {
      console.error('❌ Error in /bc_off handler:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem saat broadcast.'));
    }
  }

  // Handle text messages (for registration flow)
  static async handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    const text = msg.text;

    if (!telegramId || !text) return;
        if (text.startsWith('/')) {
      return;
    }

    // Delegate employee & admin schedule text flows
    if (sessionManager.isInEmployeeFlow(telegramId) || sessionManager.isInAdminScheduleFlow(telegramId)) {
      await EmployeeHandlers.handleTextMessage(bot, msg);
      return;
    }

    // Check if user is in driver registration flow
    if (!sessionManager.isInRegistrationFlow(telegramId)) {
      return;
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
    } catch (error) {
      console.error('❌ Error handling text message:', error);
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Terjadi kesalahan sistem'));
    }
  }

  // Handle name input
  private static async handleNameInput(bot: TelegramBot, chatId: number, telegramId: string, name: string): Promise<void> {
    // Validate name (basic validation)
    if (name.trim().length < 2) {
      await bot.sendMessage(chatId, '❌ Nama terlalu pendek. Silakan masukkan nama lengkap Anda:');
      return;
    }

    // Update session with name
    sessionManager.updateSessionData(telegramId, { name: name.trim() });
    sessionManager.setSession(telegramId, 'driver', 'waiting_driver_code');

    await bot.sendMessage(chatId, MessageUtils.getDriverCodeMessage());
  }

  // Handle driver code input
  private static async handleDriverCodeInput(bot: TelegramBot, chatId: number, telegramId: string, code: string): Promise<void> {
    const driverCode = code.trim().toUpperCase();

    // Validate driver code
    const codeResponse = await SupabaseService.validateDriverCode(driverCode);
    
    if (!codeResponse.success) {
      await bot.sendMessage(chatId, MessageUtils.getInvalidDriverCodeMessage());
      return;
    }

    // Update session with driver code
    sessionManager.updateSessionData(telegramId, { driverCode });
    sessionManager.setSession(telegramId, 'driver', 'waiting_wa');

    await bot.sendMessage(chatId, MessageUtils.getWhatsAppMessage());
  }

  // Handle WhatsApp input
  private static async handleWhatsAppInput(bot: TelegramBot, chatId: number, telegramId: string, phone: string): Promise<void> {
    // Validate phone number
    if (!MessageUtils.isValidPhoneNumber(phone)) {
      await bot.sendMessage(chatId, MessageUtils.getInvalidWhatsAppMessage());
      return;
    }

    const formattedPhone = MessageUtils.formatPhoneNumber(phone);
    
    // Update session with WhatsApp
    sessionManager.updateSessionData(telegramId, { whatsapp: formattedPhone });
    sessionManager.setSession(telegramId, 'driver', 'waiting_initial_status');

    // Get session data for summary
    const sessionData = sessionManager.getSessionData(telegramId);
    if (!sessionData || !sessionData.name || !sessionData.driverCode) {
      await bot.sendMessage(chatId, MessageUtils.getErrorMessage('Data registrasi tidak lengkap'));
      return;
    }

    // Show registration summary and ask for initial status
    const summaryMessage = MessageUtils.getRegistrationSummary(
      sessionData.name,
      sessionData.driverCode,
      formattedPhone
    );

    await bot.sendMessage(chatId, summaryMessage, {
      reply_markup: KeyboardUtils.createInitialStatusKeyboard(),
    });
  }
}

export default CommandHandlers;
