"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageUtils = void 0;
const config_1 = require("../config");
const keyboard_1 = __importDefault(require("./keyboard"));
class MessageUtils {
    static getCustomerName(order) {
        return order.costumer_name ?? order.customer_name ?? '-';
    }
    static getCustomerWa(order) {
        return order.costumer_wa ?? order.customer_wa ?? '-';
    }
    static getDriverNote(order) {
        return order.note_driver ?? order.note ?? order.catatan_driver ?? '-';
    }
    // Welcome message for /start command
    static getWelcomeMessage() {
        return `👋 Selamat datang di Driver Bot Ayam Jukut Cabe Ijo

Silakan pilih menu di tombol bawah untuk mulai.`;
    }
    // Registration start message
    static getRegistrationStartMessage() {
        return `📝 Registrasi Driver Baru

Silakan masukkan nama lengkap Anda:`;
    }
    // Ask for driver code
    static getDriverCodeMessage() {
        return `🔑 Masukkan kode driver Anda:

Kode driver diberikan oleh admin.`;
    }
    // Ask for WhatsApp number
    static getWhatsAppMessage() {
        return `📱 Masukkan nomor WhatsApp Anda:

Format: 08xxxxxxxxxx atau +62xxxxxxxxxx`;
    }
    // Registration summary
    static getRegistrationSummary(name, driverCode, whatsapp) {
        return `✅ Data Registrasi

👤 Nama: ${name}
🔑 Kode Driver: ${driverCode}
📱 WhatsApp: ${whatsapp}

Pilih status awal Anda:`;
    }
    // Registration complete
    static getRegistrationCompleteMessage(driver) {
        const statusEmoji = keyboard_1.default.getStatusEmoji(driver.status);
        const statusText = keyboard_1.default.getStatusText(driver.status);
        return `🎉 Registrasi berhasil!

👤 Nama: ${driver.nama_driver}
🔑 Kode Driver: ${driver.kode_driver}
📱 WhatsApp: ${driver.nomor_wa}
${statusEmoji} Status: ${statusText}

Selamat bergabung dengan tim driver Ayam Jukut Cabe Ijo!`;
    }
    // Driver status message
    static getDriverStatusMessage(driver, stats, activeOrders = []) {
        const statusEmoji = keyboard_1.default.getStatusEmoji(driver.status);
        const statusText = keyboard_1.default.getStatusText(driver.status);
        let activeOrdersList = '';
        if (activeOrders.length > 0) {
            activeOrdersList = '\n\n📦 Pesanan Aktif:\n' + activeOrders.map(order => `- ${order.order_code}`).join('\n');
        }
        else {
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
    static getStandbyDriversListMessage(drivers) {
        if (drivers.length === 0) {
            return '🟡 Tidak ada driver yang sedang standby.';
        }
        const driverList = drivers.map(driver => `• ${driver.nama_driver}`).join('\n');
        return `🟢 Driver Standby\n\n${driverList}`;
    }
    static getAdminBroadcastMessage(message) {
        return `📢 Pengumuman Admin\n\n${message}`;
    }
    static getDailyIncomeReportMessage(incomeData) {
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
    static getOrderListItemMessage(order) {
        let statusLine;
        const driver = order.drivers; // Joined data from Supabase
        if (driver) {
            statusLine = `Status: ✅ Sudah diambil\nDriver: ${driver.nama_driver}`;
        }
        else {
            statusLine = `Status: ⏳ Menunggu Driver...`;
        }
        return `Order #${order.order_code}\n${statusLine}`;
    }
    static getNoRecentOrdersMessage() {
        return '📦 Tidak ada order baru-baru ini.';
    }
    static getAutoOffMessage() {
        return '🔔 Waktu operasional telah berakhir. Status Anda diubah secara otomatis menjadi OFF oleh sistem karena outlet sudah tutup.';
    }
    // Order broadcast message
    static getOrderBroadcastMessage(order) {
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
    static getOrderAssignedMessage(order) {
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
    static getOrderAlreadyTakenMessage() {
        return `❌ Order sudah diambil driver lain

Silakan tunggu order berikutnya.`;
    }
    // Delivery started message
    static getDeliveryStartedMessage(order) {
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
    static getDeliveryCompletedMessage(order) {
        const customerName = this.getCustomerName(order);
        return `🎉 Delivery selesai!

${order.order_code}
👤 ${customerName}

Terima kasih sudah melakukan delivery!`;
    }
    static getNoActiveOrdersMessage() {
        return '📦 Tidak ada pesanan aktif saat ini.';
    }
    static getActiveOrderItemMessage(order) {
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
    static getStatusUpdatedMessage(status) {
        const emoji = status === 'standby' ? '🟢' : status === 'delivering' ? '🚀' : '🔴';
        const text = status === 'standby' ? 'STANDBY' : status === 'delivering' ? 'DELIVERING' : 'OFF';
        return `${emoji} Status berhasil diubah ke ${text}`;
    }
    // Error messages
    static getErrorMessage(error) {
        return `❌ Error: ${error}`;
    }
    static getNotRegisteredMessage() {
        return `❌ Anda belum terdaftar sebagai driver.

Silakan gunakan /regist_driver untuk mendaftar.`;
    }
    static getAlreadyRegisteredMessage() {
        return `✅ Anda sudah terdaftar sebagai driver.

Gunakan /status untuk melihat status Anda.`;
    }
    static getInvalidDriverCodeMessage() {
        return `❌ Kode driver tidak valid atau sudah digunakan.

Silakan hubungi admin untuk mendapatkan kode yang benar.`;
    }
    static getCannotTakeOrderMessage() {
        return `❌ Anda tidak dapat mengambil order saat ini.

Status Anda harus STANDBY untuk mengambil order.`;
    }
    static getInvalidWhatsAppMessage() {
        return `❌ Format nomor WhatsApp tidak valid.

Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxx`;
    }
    // Helper function to calculate ETA
    static calculateETA(distanceKm) {
        return Math.round(distanceKm * config_1.config.eta.minutesPerKm);
    }
    // Format phone number
    static formatPhoneNumber(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        // Convert to international format
        if (cleaned.startsWith('08')) {
            return '+62' + cleaned.substring(1);
        }
        else if (cleaned.startsWith('62')) {
            return '+' + cleaned;
        }
        else if (cleaned.startsWith('8')) {
            return '+62' + cleaned;
        }
        return phone; // Return original if format is unclear
    }
    // Validate phone number
    static isValidPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        // Check if it's a valid Indonesian mobile number
        return ((cleaned.startsWith('08') && cleaned.length >= 10 && cleaned.length <= 13) ||
            (cleaned.startsWith('628') && cleaned.length >= 11 && cleaned.length <= 14) ||
            (cleaned.startsWith('8') && cleaned.length >= 9 && cleaned.length <= 12));
    }
    // Build wa.me link from any common local format.
    static getWhatsAppLink(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (!cleaned)
            return '-';
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
exports.MessageUtils = MessageUtils;
exports.default = MessageUtils;
//# sourceMappingURL=messages.js.map