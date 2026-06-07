import { DeliveryOrder, Driver, OrderStatus } from '../types';

/** Bot action → spreadsheet status string (Apps Script column 9). */
export type SpreadsheetOrderAction =
  | 'order_assigned'
  | 'order_delivering'
  | 'order_completed';

export function slugifyDriverName(namaDriver: string): string {
  return namaDriver
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Maps bot lifecycle action to exact spreadsheet status value.
 * Apps Script updateOrderStatus writes this string as-is to column I.
 */
export function mapOrderStatusToSpreadsheet(
  action: SpreadsheetOrderAction,
  driver: Pick<Driver, 'nama_driver'>
): string {
  const slug = slugifyDriverName(driver.nama_driver);
  const name = driver.nama_driver.trim();

  switch (action) {
    case 'order_assigned':
      return `disiapkan-assigned_driver_${slug}`;
    case 'order_delivering':
      return `Sedang diantar oleh driver : ${name}`;
    case 'order_completed':
      return 'Pesanan sudah diantar';
    default:
      return 'Pesanan sudah diantar';
  }
}

export function getSpreadsheetActionForBotStatus(
  botStatus: OrderStatus,
  driver: Pick<Driver, 'nama_driver'>
): string | null {
  switch (botStatus) {
    case 'assigned':
      return mapOrderStatusToSpreadsheet('order_assigned', driver);
    case 'delivering':
      return mapOrderStatusToSpreadsheet('order_delivering', driver);
    case 'completed':
      return mapOrderStatusToSpreadsheet('order_completed', driver);
    default:
      return null;
  }
}

export function countDeliveringOrders(orders: DeliveryOrder[]): number {
  return orders.filter((o) => o.status === 'delivering').length;
}

export function countActiveOrders(orders: DeliveryOrder[]): number {
  return orders.filter((o) => o.status === 'assigned' || o.status === 'delivering').length;
}

/**
 * Driver status rules:
 * - off: unchanged unless explicitly set
 * - delivering: ≥1 order with status delivering
 * - standby: has assigned-only OR no active orders (and not off)
 */
export function resolveDriverStatusFromOrders(
  activeOrders: DeliveryOrder[],
  currentStatus: Driver['status']
): Driver['status'] {
  if (currentStatus === 'off') {
    return 'off';
  }

  const deliveringCount = countDeliveringOrders(activeOrders);
  const activeCount = countActiveOrders(activeOrders);

  if (deliveringCount > 0) {
    return 'delivering';
  }

  if (activeCount === 0) {
    return 'standby';
  }

  // Has assigned order(s) but none started delivery yet
  return 'standby';
}
