import { DeliveryOrder, Driver, PayrollEntry } from '../types';
import ScheduleService from '../services/scheduleService.js';
import { config } from '../config';
import KeyboardUtils from './keyboard';

export class MessageUtils {
  private static getCustomerName(order: DeliveryOrder): string {
    return (order as any).costumer_name ?? (order as any).customer_name ?? '-';
  }

  private static getCustomerWa(order: DeliveryOrder): string {
    return (order as any).costumer_wa ?? (order as any).customer_wa ?? '-';
  }

  private static getDriverNote(order: DeliveryOrder): string {
    return (order as any).note_driver ?? (order as any).note ?? (order as any).catatan_driver ?? '-';
  }

  // Welcome message for /start command
  static getWelcomeMessage(): string {
    return `👋 Selamat datang di Driver Bot Ayam Jukut Cabe Ijo

Silakan pilih menu di tombol bawah untuk mulai.`;
  }

  // Registration start message
  static getRegistrationStartMessage(): string {
    return `📝 Registrasi Driver Baru

Silakan masukkan nama lengkap Anda:`;
  }

  // Ask for driver code
  static getDriverCodeMessage(): string {
    return `🔑 Masukkan kode driver Anda:

Kode driver diberikan oleh admin.`;
  }

  // Ask for WhatsApp number
  static getWhatsAppMessage(): string {
    return `📱 Masukkan nomor WhatsApp Anda:

Format: 08xxxxxxxxxx atau +62xxxxxxxxxx`;
  }

  // Registration summary
  static getRegistrationSummary(name: string, driverCode: string, whatsapp: string): string {
    return `✅ Data Registrasi

👤 Nama: ${name}
🔑 Kode Driver: ${driverCode}
📱 WhatsApp: ${whatsapp}

Pilih status awal Anda:`;
  }

  // Registration complete
  static getRegistrationCompleteMessage(driver: Driver): string {
    const statusEmoji = KeyboardUtils.getStatusEmoji(driver.status);
    const statusText = KeyboardUtils.getStatusText(driver.status);
    
    return `🎉 Registrasi berhasil!

👤 Nama: ${driver.nama_driver}
🔑 Kode Driver: ${driver.kode_driver}
📱 WhatsApp: ${driver.nomor_wa}
${statusEmoji} Status: ${statusText}

Selamat bergabung dengan tim driver Ayam Jukut Cabe Ijo!`;
  }

  // Driver status message
  static getDriverStatusMessage(driver: Driver, stats: { totalDeliveries: number; activeDeliveries: number; completedToday: number; totalIncomeToday: number }, activeOrders: DeliveryOrder[] = []): string {
    const statusEmoji = KeyboardUtils.getStatusEmoji(driver.status);
    const statusText = KeyboardUtils.getStatusText(driver.status);

    return `📊 Status Driver

👤 Nama: ${driver.nama_driver}
${statusEmoji} Status: ${statusText}
📱 WhatsApp: ${driver.nomor_wa}
📦 Order Aktif: ${activeOrders.length}

📈 Statistik:
🚚 Total Delivery: ${stats.totalDeliveries}
⚡ Delivery Aktif: ${stats.activeDeliveries}/5
📅 Selesai Hari Ini: ${stats.completedToday}
💰 Pendapatan Hari Ini: Rp${stats.totalIncomeToday.toLocaleString('id-ID')}`;
  }

  static getStandbyDriversListMessage(drivers: Driver[]): string {
    if (drivers.length === 0) {
      return '🟡 Tidak ada driver yang sedang standby.';
    }

    const driverList = drivers.map(driver => `• ${driver.nama_driver}`).join('\n');
    return `🟢 Driver Standby\n\n${driverList}`;
  }

  static getAdminBroadcastMessage(message: string): string {
    return `📢 Pengumuman Admin\n\n${message}`;
  }

  static getDailyIncomeReportMessage(incomeData: { driverName: string; totalIncome: number }[]): string {
    if (!incomeData || incomeData.length === 0) {
      return '💸 Tidak ada penghasilan yang tercatat hari ini.';
    }

    let totalIncome = 0;
    const reportItems = incomeData.map(item => {
      totalIncome += item.totalIncome;
      return `• ${item.driverName} : Rp${item.totalIncome.toLocaleString('id-ID')}`;
    }).join('\n');

    return `📊 Penghasilan Driver Hari Ini\n\n${reportItems}\n\nTotal: Rp${totalIncome.toLocaleString('id-ID')}`;
  }

  static getOrderListItemMessage(order: DeliveryOrder): string {
    let statusLine: string;
    const driver = (order as any).drivers; // Joined data from Supabase

    if (driver) {
      statusLine = `Status: ✅ Sudah diambil\nDriver: ${driver.nama_driver}`;
    } else {
      statusLine = `Status: ⏳ Menunggu Driver...`;
    }

    return `Order #${order.order_code}\n${statusLine}`;
  }

  static getNoRecentOrdersMessage(): string {
    return '📦 Tidak ada order baru-baru ini.';
  }

  static getAutoOffMessage(): string {
    return '🔔 Waktu operasional telah berakhir. Status Anda diubah secara otomatis menjadi OFF oleh sistem karena outlet sudah tutup.';
  }

  // Order broadcast message
  static getOrderBroadcastMessage(order: DeliveryOrder): string {
    const eta = this.calculateETA(order.distance_km);
    const customerName = this.getCustomerName(order);
    
    return `🚨 ORDER BARU
${order.order_code}

👤 Nama: ${customerName}
🍗 Pesanan: ${order.items}
🛵 Ongkir: Rp${order.delivery_fee.toLocaleString('id-ID')}
📍 Jarak: ${order.distance_km} km
⏱️ Estimasi: ${eta} menit`;
  }

  // Order assigned message
  static getOrderAssignedMessage(order: DeliveryOrder): string {
    const customerName = this.getCustomerName(order);
    const customerWa = this.getCustomerWa(order);
    const customerWaLink = this.getWhatsAppLink(customerWa);

    return `✅ Order berhasil diambil!

${order.order_code}
👤 ${customerName}
📱 WA: ${customerWa}
💬 Chat WA: ${customerWaLink}
🍗 Pesanan: ${order.items}
💵 Total: Rp${order.total_price.toLocaleString('id-ID')}
🛵 Ongkir: Rp${order.delivery_fee.toLocaleString('id-ID')}
📍 Jarak: ${order.distance_km} km
🗺️ ${order.maps_link}
📝 Catatan: ${this.getDriverNote(order)}

Status: ASSIGNED
Silakan mulai perjalanan ke lokasi pickup.`;
  }

  // Order already taken message
  static getOrderAlreadyTakenMessage(): string {
    return `❌ Order sudah diambil driver lain

Silakan tunggu order berikutnya.`;
  }

  // Delivery started message
  static getDeliveryStartedMessage(order: DeliveryOrder): string {
    const customerName = this.getCustomerName(order);
    const customerWa = this.getCustomerWa(order);
    const customerWaLink = this.getWhatsAppLink(customerWa);

    return `🚀 Delivery dimulai!

${order.order_code}
👤 ${customerName}
📱 WA: ${customerWa}
💬 Chat WA: ${customerWaLink}
🍗 Pesanan: ${order.items}
💵 Total: Rp${order.total_price.toLocaleString('id-ID')}
🛵 Ongkir: Rp${order.delivery_fee.toLocaleString('id-ID')}
📍 Jarak: ${order.distance_km} km
🗺️ ${order.maps_link}
📝 Catatan: ${this.getDriverNote(order)}

Status: DELIVERING
Hati-hati di jalan!`;
  }

  // Delivery completed message
  static getDeliveryCompletedMessage(order: DeliveryOrder): string {
    const customerName = this.getCustomerName(order);

    return `🎉 Delivery selesai!

${order.order_code}
👤 ${customerName}

Terima kasih sudah melakukan delivery!`;
  }

  static getNoActiveOrdersMessage(): string {
    return '📦 Tidak ada pesanan aktif saat ini.';
  }

  static getActiveOrderItemMessage(order: DeliveryOrder): string {
    const customerName = this.getCustomerName(order);
    const status = order.status.toUpperCase();
    return `🚚 Pesanan Aktif
${order.order_code}
👤 ${customerName}
🍗 ${order.items}
📍 ${order.distance_km} km
📌 Status: ${status}`;
  }

  // Status updated message
  static getStatusUpdatedMessage(status: string): string {
    const emoji = status === 'standby' ? '🟢' : status === 'delivering' ? '🚀' : '🔴';
    const text = status === 'standby' ? 'STANDBY' : status === 'delivering' ? 'DELIVERING' : 'OFF';
    
    return `${emoji} Status Anda sekarang: ${text}.`;
  }

  // Error messages
  static getErrorMessage(error: string): string {
    return `❌ Error: ${error}`;
  }

  static getNotRegisteredMessage(): string {
    return `❌ Anda belum terdaftar sebagai driver.

Silakan gunakan /regist_driver untuk mendaftar.`;
  }

  static getAlreadyRegisteredMessage(): string {
    return `✅ Anda sudah terdaftar sebagai driver.

Gunakan /status untuk melihat status Anda.`;
  }

  static getInvalidDriverCodeMessage(): string {
    return `❌ Kode driver tidak valid atau sudah digunakan.

Silakan hubungi admin untuk mendapatkan kode yang benar.`;
  }

  static getCannotTakeOrderMessage(): string {
    return `❌ Anda tidak dapat mengambil order saat ini.

Status Anda harus STANDBY untuk mengambil order.`;
  }

  static getInvalidWhatsAppMessage(): string {
    return `❌ Format nomor WhatsApp tidak valid.

Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxx`;
  }

  // Helper function to calculate ETA
  private static calculateETA(distanceKm: number): number {
    return Math.round(distanceKm * config.eta.minutesPerKm);
  }

  // Format phone number
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to international format
    if (cleaned.startsWith('08')) {
      return '+62' + cleaned.substring(1);
    } else if (cleaned.startsWith('62')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('8')) {
      return '+62' + cleaned;
    }
    
    return phone; // Return original if format is unclear
  }

  // Validate phone number
  static isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indonesian mobile number
    return (
      (cleaned.startsWith('08') && cleaned.length >= 10 && cleaned.length <= 13) ||
      (cleaned.startsWith('628') && cleaned.length >= 11 && cleaned.length <= 14) ||
      (cleaned.startsWith('8') && cleaned.length >= 9 && cleaned.length <= 12)
    );
  }

  // ============== EMPLOYEE MESSAGES ==============

  static getEmployeeRegistrationStartMessage(): string {
    return `📝 Registrasi Karyawan

Silakan masukkan nama lengkap Anda:`;
  }

  static getEmployeeCodeMessage(): string {
    return `🔑 Masukkan kode verifikasi karyawan:

Kode diberikan oleh admin.`;
  }

  static getRekeningPromptMessage(): string {
    return `💳 Masukkan info rekening atau e-wallet:

Contoh: BNI 123456789 atau Gopay 081234567890`;
  }

  static getEmployeeRegistrationCompleteMessage(employee: { nama: string; no_wa: string; rekening_info: string }): string {
    return `🎉 Registrasi karyawan berhasil!

👤 Nama: ${employee.nama}
📱 WhatsApp: ${employee.no_wa}
💳 Rekening: ${employee.rekening_info}

Anda sudah terdaftar dan terverifikasi.`;
  }

  static getEmployeeAlreadyRegisteredMessage(): string {
    return `✅ Anda sudah terdaftar sebagai karyawan.`;
  }

  static getInvalidEmployeeCodeMessage(): string {
    return `❌ Kode verifikasi tidak valid atau sudah digunakan.

Silakan hubungi admin untuk mendapatkan kode yang benar.`;
  }

  static getShiftLimitPromptMessage(): string {
    return `📅 Buat Jadwal Mingguan

Masukkan *Shift Limit* per karyawan (berapa maksimal shift per orang dalam seminggu):

Contoh: 2`;
  }

  static getScheduleCreatedMessage(totalSlots: number, shiftLimit: number): string {
    return `✅ Jadwal mingguan berhasil dibuat!

📊 Total slot: ${totalSlots}
📌 Batas shift per orang: ${shiftLimit}`;
  }

  static getScheduleGenerationFailedMessage(shiftLimit: number, employeeCount: number): string {
    return `❌ Gagal membuat jadwal.

Karyawan terverifikasi: ${employeeCount}
Batas shift: ${shiftLimit}

Pastikan jumlah karyawan cukup dan batas shift realistis.`;
  }

  static getScheduleHeaderMessage(week: { start: string; end: string }): string {
    const startDisplay = ScheduleService.formatDateDisplay(week.start);
    const endDisplay = ScheduleService.formatDateDisplay(week.end);
    return `📅 *Jadwal Minggu Ini*
${startDisplay} – ${endDisplay}

Klik "Request Tukar" di samping nama untuk melepas atau menukar shift.`;
  }

  static getEmptyScheduleMessage(): string {
    return `📅 Belum ada jadwal untuk minggu ini.

Admin dapat membuat jadwal dengan /buat_jadwal di chat pribadi.`;
  }

  static getSwapRequestMessage(
    requesterName: string,
    dayName: string,
    dateDisplay: string,
    shiftLabel: string
  ): string {
    return `🔄 *${requesterName}* ingin melepas/menukar jadwal *${dayName}, ${dateDisplay} — ${shiftLabel}*.

Ada yang mau ambil?`;
  }

  static getSwapTakenMessage(takerName: string, dayName: string, shiftLabel: string): string {
    return `✅ *${takerName}* mengambil shift ${dayName} (${shiftLabel}).`;
  }

  static getSwapCompletedMessage(name1: string, name2: string): string {
    return `🔁 Tukar jadwal berhasil antara *${name1}* dan *${name2}*.`;
  }

  static getGeneralCleaningPromptMessage(): string {
    return `🧹 *General Cleaning Hari Ini*

Siapa mau ambil General Cleaning hari ini?
(Maksimal 2 orang)`;
  }

  static getGeneralCleaningTakenMessage(names: string[]): string {
    return `✅ General Cleaning hari ini diambil oleh:\n${names.map((n) => `• ${n}`).join('\n')}`;
  }

  static getGeneralCleaningFullMessage(): string {
    return `🧹 General Cleaning hari ini sudah penuh (2 orang).`;
  }

  static getPayrollReportMessage(entries: PayrollEntry[], week: { start: string; end: string }): string {
    if (entries.length === 0) {
      return `💰 Belum ada data gaji untuk minggu ${ScheduleService.formatDateDisplay(week.start)} – ${ScheduleService.formatDateDisplay(week.end)}.`;
    }

    const lines = entries.map((e) => {
      const gaji = e.totalGaji.toLocaleString('id-ID');
      const gcSuffix = e.gcCount > 0 ? ' + GC' : '';
      return `${e.nama}: ${gaji}${gcSuffix}, ${e.rekeningInfo}`;
    });

    return `💰 *Laporan Gaji Minggu Ini*
${ScheduleService.formatDateDisplay(week.start)} – ${ScheduleService.formatDateDisplay(week.end)}

${lines.join('\n')}

_Rumus: (Total Shift × Rp45.000) + label GC jika ikut General Cleaning_`;
  }

  static getGeneratedCodeMessage(code: string, type: string): string {
    return `🔑 Kode verifikasi *${type}* berhasil dibuat:

\`${code}\`

Bagikan kode ini kepada ${type === 'driver' ? 'driver' : 'karyawan'} yang akan registrasi.`;
  }

  static getGroupOnlyCommandMessage(): string {
    return `ℹ️ Perintah ini hanya tersedia di grup karyawan.`;
  }

  static getPrivateOnlyCommandMessage(): string {
    return `ℹ️ Perintah ini hanya tersedia di chat pribadi dengan bot.`;
  }

  // Build wa.me link from any common local format.
  static getWhatsAppLink(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (!cleaned) return '-';

    if (cleaned.startsWith('0')) {
      return `https://wa.me/62${cleaned.substring(1)}`;
    }

    if (cleaned.startsWith('62')) {
      return `https://wa.me/${cleaned}`;
    }

    if (cleaned.startsWith('8')) {
      return `https://wa.me/62${cleaned}`;
    }

    return `https://wa.me/${cleaned}`;
  }
}

export default MessageUtils;
