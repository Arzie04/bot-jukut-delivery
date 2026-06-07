import TelegramBot from 'node-telegram-bot-api';
export declare class CommandHandlers {
    static handleStart(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleRegistDriver(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleStatus(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleStandby(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleOff(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    private static handleNameInput;
    private static handleDriverCodeInput;
    private static handleWhatsAppInput;
}
export default CommandHandlers;
//# sourceMappingURL=commandHandlers.d.ts.map