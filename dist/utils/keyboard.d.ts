import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from 'node-telegram-bot-api';
import { CallbackData, DriverStatus } from '../types';
export declare class KeyboardUtils {
    static createDriverMainMenuKeyboard(): ReplyKeyboardMarkup;
    static createAdminMainMenuKeyboard(): ReplyKeyboardMarkup;
    static createOrderKeyboard(orderId: string): InlineKeyboardMarkup;
    static createDeliveryKeyboard(orderId: string): InlineKeyboardMarkup;
    static createCompleteKeyboard(orderId: string): InlineKeyboardMarkup;
    static createActiveOrderActionKeyboard(orderId: string, status: DriverStatus): InlineKeyboardMarkup | undefined;
    static createInitialStatusKeyboard(): InlineKeyboardMarkup;
    static parseCallbackData(data: string): CallbackData | null;
    static getStatusEmoji(status: DriverStatus): string;
    static getStatusText(status: DriverStatus): string;
}
export default KeyboardUtils;
//# sourceMappingURL=keyboard.d.ts.map