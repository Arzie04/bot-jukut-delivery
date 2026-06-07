"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardUtils = void 0;
class KeyboardUtils {
    static createMainMenuKeyboard() {
        return {
            keyboard: [
                [{ text: '📋 Status Saya' }, { text: '🚚 Pesanan Aktif' }],
                [{ text: '🟢 Standby' }, { text: '🔴 Off' }],
                [{ text: '📝 Registrasi Driver' }],
            ],
            resize_keyboard: true,
        };
    }
    // Create inline keyboard for order actions
    static createOrderKeyboard(orderId) {
        const keyboard = [
            [
                {
                    text: '🚚 AMBIL PESANAN',
                    callback_data: JSON.stringify({
                        action: 'take_order',
                        orderId,
                    }),
                },
            ],
        ];
        return { inline_keyboard: keyboard };
    }
    // Create inline keyboard for delivery actions
    static createDeliveryKeyboard(orderId) {
        const keyboard = [
            [
                {
                    text: '🚀 MULAI ANTAR',
                    callback_data: JSON.stringify({
                        action: 'start_delivery',
                        orderId,
                    }),
                },
            ],
        ];
        return { inline_keyboard: keyboard };
    }
    // Create inline keyboard for completing delivery
    static createCompleteKeyboard(orderId) {
        const keyboard = [
            [
                {
                    text: '✅ SELESAI DIANTAR',
                    callback_data: JSON.stringify({
                        action: 'complete_delivery',
                        orderId,
                    }),
                },
            ],
        ];
        return { inline_keyboard: keyboard };
    }
    static createActiveOrderActionKeyboard(orderId, status) {
        if (status === 'assigned') {
            return this.createDeliveryKeyboard(orderId);
        }
        if (status === 'delivering') {
            return this.createCompleteKeyboard(orderId);
        }
        return undefined;
    }
    // Create inline keyboard for initial status selection
    static createInitialStatusKeyboard() {
        const keyboard = [
            [
                {
                    text: '🔴 OFF',
                    callback_data: JSON.stringify({
                        action: 'set_status',
                        status: 'off',
                    }),
                },
                {
                    text: '🟢 STANDBY',
                    callback_data: JSON.stringify({
                        action: 'set_status',
                        status: 'standby',
                    }),
                },
            ],
        ];
        return { inline_keyboard: keyboard };
    }
    // Parse callback data safely
    static parseCallbackData(data) {
        try {
            return JSON.parse(data);
        }
        catch (error) {
            console.error('❌ Error parsing callback data:', error);
            return null;
        }
    }
    // Create status emoji
    static getStatusEmoji(status) {
        switch (status) {
            case 'off':
                return '🔴';
            case 'standby':
                return '🟢';
            case 'assigned':
                return '🟡';
            case 'delivering':
                return '🚚';
            default:
                return '❓';
        }
    }
    // Create status text
    static getStatusText(status) {
        switch (status) {
            case 'off':
                return 'OFF';
            case 'standby':
                return 'STANDBY';
            case 'assigned':
                return 'ASSIGNED';
            case 'delivering':
                return 'DELIVERING';
            default:
                return 'UNKNOWN';
        }
    }
}
exports.KeyboardUtils = KeyboardUtils;
exports.default = KeyboardUtils;
//# sourceMappingURL=keyboard.js.map