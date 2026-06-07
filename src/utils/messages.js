"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageUtils = void 0;
const types_1 = require("../types");
const config_1 = require("../config");
const keyboard_1 = __importDefault(require("./keyboard"));
class MessageUtils {
    // Welcome message for /start command
    static getWelcomeMessage() {
        return `👋 Selamat datang di Driver Bot Ayam Jukut Cabe Ijo

Command tersedia:
/regist_driver → Registrasi driver
/status → Lihat status driver
/standby → Aktif standby
/off → Nonaktifkan driver`;
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
🔑 Kode Driver: ${driver.kode}
📱 WhatsApp: ${driver.whatsapp}
${statusEmoji} Status: ${statusText}

Selamat bergabung dengan tim driver Ayam Jukut Cabe Ijo!`;
    }
    // Driver status message
    static getDriverStatusMessage(driver, stats) {
        const statusEmoji = keyboard_1.default.getStatusEmoji(driver.status);
        const statusText = keyboard_1.default.getStatusText(driver.status);
        return `📊 Status Driver

👤 Nama: ${driver.nama_driver}
${statusEmoji} Status: ${statusText}
📱 WhatsApp: ${driver.whatsapp}

📈 Statistik:
🚚 Total Delivery: ${stats.totalDeliveries}
⚡ Delivery Aktif: ${stats.activeDeliveries}
📅 Selesai Hari Ini: ${stats.completedToday}`;
    }
    // Order broadcast message
    static getOrderBroadcastMessage(order) {
        const eta = this.calculateETA(order.distance_km);
        return `🚨 ORDER BARU
${order.order_id}

👤 Nama: ${order.customer_name}
🍗 Pesanan: ${order.items}
📍 Jarak: ${order.distance_km} km
⏱️ ETA: ${eta} menit
📍 Lokasi: ${order.location}`;
    }
    // Order assigned message
    static getOrderAssignedMessage(order) {
        return `✅ Order berhasil diambil!

${order.order_id}
👤 ${order.customer_name}
📍 ${order.location}

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
        return `🚀 Delivery dimulai!

${order.order_id}
👤 ${order.customer_name}
📍 ${order.location}

Status: DELIVERING
Hati-hati di jalan!`;
    }
    // Delivery completed message
    static getDeliveryCompletedMessage(order) {
        return `🎉 Delivery selesai!

${order.order_id}
👤 ${order.customer_name}

Terima kasih sudah melakukan delivery!
Status Anda kembali ke STANDBY.`;
    }
    // Status updated message
    static getStatusUpdatedMessage(status) {
        const emoji = status === 'standby' ? '🟢' : '🔴';
        const text = status === 'standby' ? 'STANDBY' : 'OFF';
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
}
exports.MessageUtils = MessageUtils;
exports.default = MessageUtils;
//# sourceMappingURL=messages.js.map