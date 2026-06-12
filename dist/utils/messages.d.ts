import { DeliveryOrder, Driver, PayrollEntry } from '../types';
export declare class MessageUtils {
    private static getCustomerName;
    private static getCustomerWa;
    private static getDriverNote;
    static getWelcomeMessage(): string;
    static getRegistrationStartMessage(): string;
    static getDriverCodeMessage(): string;
    static getWhatsAppMessage(): string;
    static getRegistrationSummary(name: string, driverCode: string, whatsapp: string): string;
    static getRegistrationCompleteMessage(driver: Driver): string;
    static getDriverStatusMessage(driver: Driver, stats: {
        totalDeliveries: number;
        activeDeliveries: number;
        completedToday: number;
        totalIncomeToday: number;
    }, activeOrders?: DeliveryOrder[]): string;
    static getStandbyDriversListMessage(drivers: Driver[]): string;
    static getAdminBroadcastMessage(message: string): string;
    static getDailyIncomeReportMessage(incomeData: {
        driverName: string;
        totalIncome: number;
    }[]): string;
    static getOrderListItemMessage(order: DeliveryOrder): string;
    static getNoRecentOrdersMessage(): string;
    static getAutoOffMessage(): string;
    static getOrderBroadcastMessage(order: DeliveryOrder): string;
    static getOrderAssignedMessage(order: DeliveryOrder): string;
    static getOrderAlreadyTakenMessage(): string;
    static getDeliveryStartedMessage(order: DeliveryOrder): string;
    static getDeliveryCompletedMessage(order: DeliveryOrder): string;
    static getNoActiveOrdersMessage(): string;
    static getActiveOrderItemMessage(order: DeliveryOrder): string;
    static getStatusUpdatedMessage(status: string): string;
    static getErrorMessage(error: string): string;
    static getNotRegisteredMessage(): string;
    static getAlreadyRegisteredMessage(): string;
    static getInvalidDriverCodeMessage(): string;
    static getCannotTakeOrderMessage(): string;
    static getInvalidWhatsAppMessage(): string;
    private static calculateETA;
    static formatPhoneNumber(phone: string): string;
    static isValidPhoneNumber(phone: string): boolean;
    static getEmployeeRegistrationStartMessage(): string;
    static getEmployeeCodeMessage(): string;
    static getRekeningPromptMessage(): string;
    static getEmployeeRegistrationCompleteMessage(employee: {
        nama: string;
        no_wa: string;
        rekening_info: string;
    }): string;
    static getEmployeeAlreadyRegisteredMessage(): string;
    static getInvalidEmployeeCodeMessage(): string;
    static getShiftLimitPromptMessage(): string;
    static getScheduleCreatedMessage(totalSlots: number, shiftLimit: number): string;
    static getScheduleGenerationFailedMessage(shiftLimit: number, employeeCount: number): string;
    static getScheduleHeaderMessage(week: {
        start: string;
        end: string;
    }): string;
    static getEmptyScheduleMessage(): string;
    static getSwapRequestMessage(requesterName: string, dayName: string, dateDisplay: string, shiftLabel: string): string;
    static getSwapTakenMessage(takerName: string, dayName: string, shiftLabel: string): string;
    static getSwapCompletedMessage(name1: string, name2: string): string;
    static getGeneralCleaningPromptMessage(): string;
    static getGeneralCleaningTakenMessage(names: string[]): string;
    static getGeneralCleaningFullMessage(): string;
    static getPayrollReportMessage(entries: PayrollEntry[], week: {
        start: string;
        end: string;
    }): string;
    static getGeneratedCodeMessage(code: string, type: string): string;
    static getGroupOnlyCommandMessage(): string;
    static getPrivateOnlyCommandMessage(): string;
    static getWhatsAppLink(phone: string): string;
}
export default MessageUtils;
//# sourceMappingURL=messages.d.ts.map