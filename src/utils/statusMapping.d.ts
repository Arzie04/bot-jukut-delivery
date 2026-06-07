import { DeliveryOrder, Driver, OrderStatus } from '../types';
/** Bot action → spreadsheet status string (Apps Script column 9). */
export type SpreadsheetOrderAction = 'order_assigned' | 'order_delivering' | 'order_completed';
export declare function slugifyDriverName(namaDriver: string): string;
/**
 * Maps bot lifecycle action to exact spreadsheet status value.
 * Apps Script updateOrderStatus writes this string as-is to column I.
 */
export declare function mapOrderStatusToSpreadsheet(action: SpreadsheetOrderAction, driver: Pick<Driver, 'nama_driver'>): string;
export declare function getSpreadsheetActionForBotStatus(botStatus: OrderStatus, driver: Pick<Driver, 'nama_driver'>): string | null;
export declare function countDeliveringOrders(orders: DeliveryOrder[]): number;
export declare function countActiveOrders(orders: DeliveryOrder[]): number;
/**
 * Driver status rules:
 * - off: unchanged unless explicitly set
 * - delivering: ≥1 order with status delivering
 * - standby: has assigned-only OR no active orders (and not off)
 */
export declare function resolveDriverStatusFromOrders(activeOrders: DeliveryOrder[], currentStatus: Driver['status']): Driver['status'];
//# sourceMappingURL=statusMapping.d.ts.map