import { Driver } from '../types';
import { SpreadsheetOrderAction } from '../utils/statusMapping';
interface SpreadsheetUpdateResult {
    success: boolean;
    orderCode: string;
    previousStatus: string | undefined;
    nextStatus: string;
    driverName?: string;
    httpStatus?: number;
    responseBody?: string;
    error?: string;
}
export declare class SpreadsheetService {
    private static buildPayload;
    private static sendUpdateRequest;
    private static parseAppsScriptSuccess;
    private static orderCodeVariants;
    /**
     * Sync order status to Google Apps Script (SC-A8: doGet api=updateStatus).
     */
    static syncOrderStatus(orderCode: string, action: SpreadsheetOrderAction, driver: Pick<Driver, 'nama_driver'>, context?: {
        previousStatus?: string;
    }): Promise<SpreadsheetUpdateResult>;
    /** @deprecated Use syncOrderStatus — kept for backward compatibility */
    static updateOrderStatus(orderCode: string, status: string, driver?: Pick<Driver, 'nama_driver'>): Promise<boolean>;
}
export default SpreadsheetService;
//# sourceMappingURL=spreadsheet.d.ts.map