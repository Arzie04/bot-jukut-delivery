import { Driver, DriverCode, DeliveryOrder, DriverStatus, OrderStatus, ApiResponse } from '../types';
export declare class SupabaseService {
    static getDriverByTelegramId(telegramId: string): Promise<ApiResponse<Driver>>;
    static createDriver(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Driver>>;
    static updateDriverStatus(telegramId: string, status: DriverStatus): Promise<ApiResponse<Driver>>;
    static getAllDrivers(): Promise<ApiResponse<Driver[]>>;
    static getDriversByStatus(status: DriverStatus): Promise<ApiResponse<Driver[]>>;
    static updateAllDriversStatus(status: DriverStatus): Promise<ApiResponse<Driver[]>>;
    static getEligibleDriversForBroadcast(): Promise<ApiResponse<Driver[]>>;
    static validateDriverCode(code: string): Promise<ApiResponse<DriverCode>>;
    static markDriverCodeAsUsed(code: string, usedBy?: number): Promise<ApiResponse<DriverCode>>;
    static getRecentOrders(limit?: number): Promise<ApiResponse<DeliveryOrder[]>>;
    static getWaitingOrders(): Promise<ApiResponse<DeliveryOrder[]>>;
    static assignOrderToDriver(orderId: string, driverId: number): Promise<ApiResponse<DeliveryOrder>>;
    static updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<DeliveryOrder>>;
    static getDriverActiveOrders(driverId: number): Promise<ApiResponse<DeliveryOrder[]>>;
    static getDriverStats(driverId: number): Promise<ApiResponse<{
        totalDeliveries: number;
        activeDeliveries: number;
        completedToday: number;
        totalIncomeToday: number;
    }>>;
    static getTodaysIncomeByDriver(): Promise<ApiResponse<{
        driverName: string;
        totalIncome: number;
    }[]>>;
}
export default SupabaseService;
//# sourceMappingURL=supabase.d.ts.map