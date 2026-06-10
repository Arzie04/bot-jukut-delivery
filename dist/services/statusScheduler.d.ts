import type TelegramBot from 'node-telegram-bot-api';
declare class StatusSchedulerService {
    private static timer;
    private static bot;
    private static lastRunKey;
    private static readonly intervalMs;
    static start(bot: TelegramBot): void;
    static stop(): void;
    private static check;
}
export default StatusSchedulerService;
//# sourceMappingURL=statusScheduler.d.ts.map