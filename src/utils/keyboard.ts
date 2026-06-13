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
          callback_data: `take_order:${orderId}`,
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
          callback_data: `start_delivery:${orderId}`,
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
          callback_data: `complete_delivery:${orderId}`,
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

  static createMyShiftsKeyboard(schedules: Schedule[]): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = schedules.map(s => {
      const date = ScheduleService.formatDateDisplay(s.tanggal);
      const day = ScheduleService.getDayName(s.tanggal);
      const shift = ScheduleService.getShiftLabel(s.shift as any);
      
      return [{
        text: `📅 ${day}, ${date} (${shift})`,
        callback_data: `request_swap:${s.id}`
      }];
    });

    return { inline_keyboard: keyboard };
  }

  static createSwapActionKeyboard(swapRequestId: number): InlineKeyboardMarkup {
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

  static createGeneralCleaningKeyboard(): InlineKeyboardMarkup {
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
  static parseCallbackData(data: string): CallbackData | null {
    try {
      // Fallback untuk format JSON (pesan lama yang masih ada di chat)
      if (data.startsWith('{')) {
        return JSON.parse(data) as CallbackData;
      }

      // Format baru: "action:value"
      const colonIndex = data.indexOf(':');
      if (colonIndex === -1) {
        return { action: data } as CallbackData;
      }

      const action = data.substring(0, colonIndex);
      const value = data.substring(colonIndex + 1);

      const result: any = { action };

      if (value) {
        if (action === 'set_status') {
          result.status = value as DriverStatus;
        } else if (['take_order', 'start_delivery', 'complete_delivery'].includes(action)) {
          result.orderId = value;
        } else if (action === 'request_swap') {
          result.scheduleId = value;
        } else if (['take_shift', 'swap_shift'].includes(action)) {
          result.swapRequestId = parseInt(value, 10);
        }
      }

      return result as CallbackData;
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
