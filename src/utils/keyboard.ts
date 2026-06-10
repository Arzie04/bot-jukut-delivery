import { InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup } from 'node-telegram-bot-api';
import { CallbackData, DriverStatus } from '../types';

export class KeyboardUtils {
  static createDriverMainMenuKeyboard(): ReplyKeyboardMarkup {
    return {
      keyboard: [
        [{ text: '/status' }],
        [{ text: '/standby' }, { text: '/off' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  }

  static createAdminMainMenuKeyboard(): ReplyKeyboardMarkup {
    return {
      keyboard: [
        [{ text: '/listorder' }, { text: '/cekpenghasilan' }],
        [{ text: '/standby' }, { text: '/off_all_driver' }],
        [{ text: '/bc' }, { text: '/bc-standby' }, { text: '/bc-off' }],
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