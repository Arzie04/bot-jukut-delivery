import TelegramBot from 'node-telegram-bot-api';
export declare class CallbackHandlers {
    static handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery): Promise<void>;
    private static handleSetStatus;
    private static handleTakeOrder;
    private static handleStartDelivery;
    private static handleCompleteDelivery;
}
export default CallbackHandlers;
//# sourceMappingURL=callbackHandlers.d.ts.map