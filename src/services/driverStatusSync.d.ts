import { DriverStatus } from '../types';
export declare class DriverStatusSyncService {
    /**
     * Recompute driver status from active orders and persist if changed.
     */
    static syncFromActiveOrders(telegramId: string, driverId: number, options?: {
        respectOff?: boolean;
    }): Promise<{
        status: DriverStatus;
        changed: boolean;
    }>;
}
export default DriverStatusSyncService;
//# sourceMappingURL=driverStatusSync.d.ts.map