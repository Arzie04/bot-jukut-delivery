"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverStatusSyncService = void 0;
const supabase_1 = __importDefault(require("./supabase"));
const statusMapping_1 = require("../utils/statusMapping");
class DriverStatusSyncService {
    /**
     * Recompute driver status from active orders and persist if changed.
     */
    static async syncFromActiveOrders(telegramId, driverId, options) {
        const driverResponse = await supabase_1.default.getDriverByTelegramId(telegramId);
        const currentStatus = driverResponse.data?.status ?? 'standby';
        if (options?.respectOff !== false && currentStatus === 'off') {
            return { status: 'off', changed: false };
        }
        const activeOrdersResponse = await supabase_1.default.getDriverActiveOrders(driverId);
        const activeOrders = activeOrdersResponse.data || [];
        const nextStatus = (0, statusMapping_1.resolveDriverStatusFromOrders)(activeOrders, currentStatus);
        if (nextStatus === currentStatus) {
            console.log(`ℹ️ Driver ${telegramId} status unchanged: ${currentStatus}`);
            return { status: currentStatus, changed: false };
        }
        const updateResponse = await supabase_1.default.updateDriverStatus(telegramId, nextStatus);
        if (!updateResponse.success) {
            console.error(`❌ Failed syncing driver status for ${telegramId}:`, updateResponse.error);
            return { status: currentStatus, changed: false };
        }
        console.log(`✅ Driver ${telegramId} status synced: ${currentStatus} → ${nextStatus}`);
        return { status: nextStatus, changed: true };
    }
}
exports.DriverStatusSyncService = DriverStatusSyncService;
exports.default = DriverStatusSyncService;
//# sourceMappingURL=driverStatusSync.js.map