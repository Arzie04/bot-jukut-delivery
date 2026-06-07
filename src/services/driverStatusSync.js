import SupabaseService from './supabase';
import { resolveDriverStatusFromOrders } from '../utils/statusMapping';
import { Driver, DriverStatus } from '../types';
export class DriverStatusSyncService {
    /**
     * Recompute driver status from active orders and persist if changed.
     */
    static async syncFromActiveOrders(telegramId, driverId, options) {
        const driverResponse = await SupabaseService.getDriverByTelegramId(telegramId);
        const currentStatus = driverResponse.data?.status ?? 'standby';
        if (options?.respectOff !== false && currentStatus === 'off') {
            return { status: 'off', changed: false };
        }
        const activeOrdersResponse = await SupabaseService.getDriverActiveOrders(driverId);
        const activeOrders = activeOrdersResponse.data || [];
        const nextStatus = resolveDriverStatusFromOrders(activeOrders, currentStatus);
        if (nextStatus === currentStatus) {
            console.log(`ℹ️ Driver ${telegramId} status unchanged: ${currentStatus}`);
            return { status: currentStatus, changed: false };
        }
        const updateResponse = await SupabaseService.updateDriverStatus(telegramId, nextStatus);
        if (!updateResponse.success) {
            console.error(`❌ Failed syncing driver status for ${telegramId}:`, updateResponse.error);
            return { status: currentStatus, changed: false };
        }
        console.log(`✅ Driver ${telegramId} status synced: ${currentStatus} → ${nextStatus}`);
        return { status: nextStatus, changed: true };
    }
}
export default DriverStatusSyncService;
//# sourceMappingURL=driverStatusSync.js.map