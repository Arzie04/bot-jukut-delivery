import { DeliveryOrder, Driver } from '../types';
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
    static getWhatsAppLink(phone: string): string;
}
export default MessageUtils;
//# sourceMappingURL=messages.d.ts.map