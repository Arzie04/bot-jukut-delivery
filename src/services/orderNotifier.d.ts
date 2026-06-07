import TelegramBot from 'node-telegram-bot-api';
declare class OrderNotifierService {
    private static intervalId;
    private static isProcessing;
    private static readonly notifiedDriversByOrder;
    private static readonly messageRefsByOrder;
    private static readonly pollIntervalMs;
    static start(bot: TelegramBot): void;
    static stop(): void;
    static markOrderTaken(bot: TelegramBot, orderCode: string, takenByTelegramId: string): Promise<void>;
    private static processWaitingOrders;
}
export default OrderNotifierService;
//# sourceMappingURL=orderNotifier.d.ts.map