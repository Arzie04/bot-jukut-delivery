import { InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup } from 'node-telegram-bot-api';
import { CallbackData, DriverStatus, Schedule } from '../types';
import ScheduleService from '../services/scheduleService.js';

export class KeyboardUtils {
  static createDriverMainMenuKeyboard(): ReplyKeyboardMarkup {
    return {
      keyboard: [
        [{ text: '/status' }, { text: '/standby' }],
        [{ text: '/off' }, { text: '/active_order' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  }

  static createAdminMainMenuKeyboard(): ReplyKeyboardMarkup {
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

  static createUnregisteredKeyboard(): ReplyKeyboardMarkup {
    return {
      keyboard: [
        [{ text: '/regist_driver' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  }

  // Create inline keyboard for order actions
  static createOrderKeyboard(orderId: string): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [
      [
        {
          text: '🚚 AMBIL PESANAN',
          callback_data: JSON.stringify({
            action: 'take_order',
            orderId,
          } as CallbackData),
        },
      ],
    ];

    return { inline_keyboard: keyboard };
  }

  // Create inline keyboard for delivery actions
  static createDeliveryKeyboard(orderId: string): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [
      [
        {
          text: '🚀 MULAI ANTAR',
          callback_data: JSON.stringify({
            action: 'start_delivery',
            orderId,
          } as CallbackData),
        },
      ],
    ];

    return { inline_keyboard: keyboard };
  }

  // Create inline keyboard for completing delivery
  static createCompleteKeyboard(orderId: string): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [
      [
        {
          text: '✅ SELESAI DIANTAR',
          callback_data: JSON.stringify({
            action: 'complete_delivery',
            orderId,
          } as CallbackData),
        },
      ],
    ];

    return { inline_keyboard: keyboard };
  }

  static createActiveOrderActionKeyboard(orderId: string, status: DriverStatus): InlineKeyboardMarkup | undefined {
    if (status === 'assigned') {
      return this.createDeliveryKeyboard(orderId);
    }
    if (status === 'delivering') {
      return this.createCompleteKeyboard(orderId);
    }
    return undefined;
  }

  // Create inline keyboard for initial status selection
  static createInitialStatusKeyboard(): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [
      [
        {
          text: '🔴 OFF',
          callback_data: JSON.stringify({
            action: 'set_status',
            status: 'off',
          } as CallbackData),
        },
        {
          text: '🟢 STANDBY',
          callback_data: JSON.stringify({
            action: 'set_status',
            status: 'standby',
          } as CallbackData),
        },
      ],
    ];

    return { inline_keyboard: keyboard };
  }

  static createScheduleSwapKeyboard(slots: Schedule[]): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[] = slots
      .filter((s) => s.id)
      .map((s) => {
        const name = ScheduleService.getEmployeeFromSchedule(s)?.nama || 'Karyawan';
        return {
          text: `🔄 Request Tukar ${name}`,
          callback_data: JSON.stringify({
            action: 'request_swap',
            scheduleId: s.id,
          } as CallbackData),
        };
      });

    const rows: InlineKeyboardButton[][] = [];
    for (let i = 0; i < buttons.length; i += 2) {
      rows.push(buttons.slice(i, i + 2));
    }

    return { inline_keyboard: rows };
  }

  static createSwapActionKeyboard(swapRequestId: number): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: '✅ Ambil',
            callback_data: JSON.stringify({
              action: 'take_shift',
              swapRequestId,
            } as CallbackData),
          },
          {
            text: '🔁 Tukar',
            callback_data: JSON.stringify({
              action: 'swap_shift',
              swapRequestId,
            } as CallbackData),
          },
        ],
      ],
    };
  }

  static createGeneralCleaningKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: '✅ Ambil',
            callback_data: JSON.stringify({
              action: 'take_gc',
            } as CallbackData),
          },
        ],
      ],
    };
  }

  // Parse callback data safely
  static parseCallbackData(data: string): CallbackData | null {
    try {
      return JSON.parse(data) as CallbackData;
    } catch (error) {
      console.error('❌ Error parsing callback data:', error);
      return null;
    }
  }

  // Create status emoji
  static getStatusEmoji(status: DriverStatus): string {
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
  static getStatusText(status: DriverStatus): string {
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

export default KeyboardUtils;
