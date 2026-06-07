import { DeliveryOrder, Driver } from '../types';
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
    
    let activeOrdersList = '';
    if (activeOrders.length > 0) {
      activeOrdersList = '\n\n📦 Pesanan Aktif:\n' + activeOrders.map(order => `- ${order.order_code}`).join('\n');
    } else {
      activeOrdersList = '\n\n📦 Pesanan Aktif: Tidak ada';
    }

    return `📊 Status Driver

👤 Nama: ${driver.nama_driver}
${statusEmoji} Status: ${statusText}
📱 WhatsApp: ${driver.nomor_wa}

📈 Statistik:
🚚 Total Delivery: ${stats.totalDeliveries}
⚡ Delivery Aktif: ${stats.activeDeliveries}/5
📅 Selesai Hari Ini: ${stats.completedToday}
💰 Pendapatan Hari Ini: Rp${stats.totalIncomeToday.toLocaleString('id-ID')}${activeOrdersList}`;
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
    
    return `${emoji} Status berhasil diubah ke ${text}`;
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