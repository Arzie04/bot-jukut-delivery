import type TelegramBot from 'node-telegram-bot-api';
export declare class CommandHandlers {
    private static isAdmin;
    static handleStart(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleRegistDriver(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleStatus(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleActiveOrders(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleStandby(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleOff(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleOffAllDriver(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    private static _broadcastMessage;
    static handleListOrder(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleCekPenghasilan(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleBroadcast(bot: TelegramBot, msg: TelegramBot.Message, messageText: string): Promise<void>;
    static handleBroadcastStandby(bot: TelegramBot, msg: TelegramBot.Message, messageText: string): Promise<void>;
    static handleBroadcastOff(bot: TelegramBot, msg: TelegramBot.Message, messageText: string): Promise<void>;
    static handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    private static handleNameInput;
    private static handleDriverCodeInput;
    private static handleWhatsAppInput;
}
export default CommandHandlers;
//# sourceMappingURL=commandHandlers.d.ts.map