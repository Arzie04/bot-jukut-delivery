import { Driver, DriverCode, DeliveryOrder, DriverStatus, OrderStatus, ApiResponse, Employee, VerificationCode, VerificationCodeType, Schedule, GeneralCleaningLog, SwapRequest, PayrollEntry } from '../types';
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
    static getEmployeeByTelegramId(telegramId: string): Promise<ApiResponse<Employee>>;
    static createEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Promise<ApiResponse<Employee>>;
    static getEmployeeById(employeeId: number): Promise<ApiResponse<Employee>>;
    static getVerifiedEmployees(): Promise<ApiResponse<Employee[]>>;
    static validateVerificationCode(code: string, type: VerificationCodeType): Promise<ApiResponse<VerificationCode>>;
    static markVerificationCodeAsUsed(code: string): Promise<ApiResponse<VerificationCode>>;
    static createVerificationCode(type: VerificationCodeType): Promise<ApiResponse<VerificationCode>>;
    private static generateRandomCode;
    static getSchedulesForWeek(startDate: string, endDate: string): Promise<ApiResponse<Schedule[]>>;
    static replaceWeekSchedules(startDate: string, endDate: string, schedules: Omit<Schedule, 'id' | 'created_at'>[]): Promise<ApiResponse<Schedule[]>>;
    static getScheduleById(scheduleId: number): Promise<ApiResponse<Schedule>>;
    static updateScheduleEmployee(scheduleId: number, employeeId: number): Promise<ApiResponse<Schedule>>;
    static getEmployeeFutureSchedules(employeeId: number, fromDate: string): Promise<ApiResponse<Schedule[]>>;
    static createSwapRequest(scheduleId: number, requesterId: number): Promise<ApiResponse<SwapRequest>>;
    static getSwapRequestById(id: number): Promise<ApiResponse<SwapRequest>>;
    static completeSwapRequest(id: number): Promise<ApiResponse<SwapRequest>>;
    static createGeneralCleaningLog(tanggal: string, employeeId: number): Promise<ApiResponse<GeneralCleaningLog>>;
    static hasEmployeeTakenGcOnDate(employeeId: number, tanggal: string): Promise<ApiResponse<boolean>>;
    static countGeneralCleaningForDate(tanggal: string): Promise<ApiResponse<number>>;
    static getGeneralCleaningLogsForWeek(startDate: string, endDate: string): Promise<ApiResponse<GeneralCleaningLog[]>>;
    static getWeeklyPayroll(startDate: string, endDate: string): Promise<ApiResponse<PayrollEntry[]>>;
    static getTodaysIncomeByDriver(): Promise<ApiResponse<{
        driverName: string;
        totalIncome: number;
    }[]>>;
}
export default SupabaseService;
//# sourceMappingURL=supabase.d.ts.map