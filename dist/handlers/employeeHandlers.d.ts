import type TelegramBot from 'node-telegram-bot-api';
import type { Schedule } from '../types/index.js';
export declare class EmployeeHandlers {
    static handleRegistKaryawan(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleBuatJadwal(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleGeneralCleaning(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleListGaji(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static handleGenerateCode(bot: TelegramBot, msg: TelegramBot.Message, typeArg?: string): Promise<void>;
    static handleJadwal(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    static sendScheduleMessages(bot: TelegramBot, chatId: number, schedules: Schedule[], week: {
        start: string;
        end: string;
        dates: string[];
    }): Promise<void>;
    static handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>;
    private static handleEmployeeTextFlow;
    private static handleEmployeeNameInput;
    private static handleEmployeeCodeInput;
    private static handleEmployeeWaInput;
    private static handleRekeningInput;
    private static handleShiftLimitInput;
}
export default EmployeeHandlers;
//# sourceMappingURL=employeeHandlers.d.ts.map