import type TelegramBot from 'node-telegram-bot-api';
export declare class CallbackHandlers {
    static handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery): Promise<void>;
    private static handleSetStatus;
    private static handleTakeOrder;
    private static handleStartDelivery;
    private static handleRequestSwap;
    private static handleTakeShift;
    private static handleSwapShift;
    private static handleTakeGeneralCleaning;
    private static handleCompleteDelivery;
}
export default CallbackHandlers;
//# sourceMappingURL=callbackHandlers.d.ts.map