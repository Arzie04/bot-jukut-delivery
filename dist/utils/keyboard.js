"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardUtils = void 0;
const scheduleService_js_1 = __importDefault(require("../services/scheduleService.js"));
class KeyboardUtils {
    static createDriverMainMenuKeyboard() {
        return {
            keyboard: [
                [{ text: '/status' }, { text: '/standby' }],
                [{ text: '/off' }, { text: '/active_order' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
        };
    }
    static createAdminMainMenuKeyboard() {
        return {
            keyboard: [
                [{ text: '/admin' }],
                [{ text: '/listorder' }, { text: '/cekpenghasilan' }],
                [{ text: '/list_standby' }, { text: '/off_all_driver' }],
                [{ text: '/buat_jadwal' }, { text: '/list_gaji' }],
                [{ text: '/general_cleaning' }, { text: '/generate_code' }],
                [{ text: '/bc' }, { text: '/bc_standby' }, { text: '/bc_off' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
        };
    }
    static createUnregisteredKeyboard() {
        return {
            keyboard: [
                [{ text: '/regist_driver' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
        };
    }
    // Create inline keyboard for order actions
    static createOrderKeyboard(orderId) {
        const keyboard = [
            [
                {
                    text: '🚚 AMBIL PESANAN',
                    callback_data: `take_order:${orderId}`,
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
                    callback_data: `start_delivery:${orderId}`,
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
                    callback_data: `complete_delivery:${orderId}`,
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
                    callback_data: 'set_status:off',
                },
                {
                    text: '🟢 STANDBY',
                    callback_data: 'set_status:standby',
                },
            ],
        ];
        return { inline_keyboard: keyboard };
    }
    static createScheduleSwapKeyboard(slots) {
        const buttons = slots
            .filter((s) => s.id)
            .map((s) => {
            const name = scheduleService_js_1.default.getEmployeeFromSchedule(s)?.nama || 'Karyawan';
            return {
                text: `🔄 Request Tukar ${name}`,
                callback_data: `request_swap:${s.id}`,
            };
        });
        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
            rows.push(buttons.slice(i, i + 2));
        }
        return { inline_keyboard: rows };
    }
    static createSwapActionKeyboard(swapRequestId) {
        return {
            inline_keyboard: [
                [
                    {
                        text: '✅ Ambil',
                        callback_data: `take_shift:${swapRequestId}`,
                    },
                    {
                        text: '🔁 Tukar',
                        callback_data: `swap_shift:${swapRequestId}`,
                    },
                ],
            ],
        };
    }
    static createGeneralCleaningKeyboard() {
        return {
            inline_keyboard: [
                [
                    {
                        text: '✅ Ambil',
                        callback_data: 'take_gc',
                    },
                ],
            ],
        };
    }
    // Parse callback data safely
    static parseCallbackData(data) {
        try {
            // Fallback untuk format JSON (pesan lama yang masih ada di chat)
            if (data.startsWith('{')) {
                return JSON.parse(data);
            }
            // Format baru: "action:value"
            const colonIndex = data.indexOf(':');
            if (colonIndex === -1) {
                return { action: data };
            }
            const action = data.substring(0, colonIndex);
            const value = data.substring(colonIndex + 1);
            const result = { action };
            if (value) {
                if (action === 'set_status') {
                    result.status = value;
                }
                else if (['take_order', 'start_delivery', 'complete_delivery'].includes(action)) {
                    result.orderId = value;
                }
                else if (action === 'request_swap') {
                    result.scheduleId = value;
                }
                else if (['take_shift', 'swap_shift'].includes(action)) {
                    result.swapRequestId = parseInt(value, 10);
                }
            }
            return result;
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