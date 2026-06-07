import { InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { CallbackData, DriverStatus } from '../types';
export declare class KeyboardUtils {
    static createOrderKeyboard(orderId: string): InlineKeyboardMarkup;
    static createDeliveryKeyboard(orderId: string): InlineKeyboardMarkup;
    static createCompleteKeyboard(orderId: string): InlineKeyboardMarkup;
    static createInitialStatusKeyboard(): InlineKeyboardMarkup;
    static parseCallbackData(data: string): CallbackData | null;
    static getStatusEmoji(status: DriverStatus): string;
    static getStatusText(status: DriverStatus): string;
}
export default KeyboardUtils;
//# sourceMappingURL=keyboard.d.ts.map