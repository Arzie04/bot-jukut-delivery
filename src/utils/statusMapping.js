"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifyDriverName = slugifyDriverName;
exports.mapOrderStatusToSpreadsheet = mapOrderStatusToSpreadsheet;
exports.getSpreadsheetActionForBotStatus = getSpreadsheetActionForBotStatus;
exports.countDeliveringOrders = countDeliveringOrders;
exports.countActiveOrders = countActiveOrders;
exports.resolveDriverStatusFromOrders = resolveDriverStatusFromOrders;
const types_1 = require("../types");
function slugifyDriverName(namaDriver) {
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
function mapOrderStatusToSpreadsheet(action, driver) {
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
function getSpreadsheetActionForBotStatus(botStatus, driver) {
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
function countDeliveringOrders(orders) {
    return orders.filter((o) => o.status === 'delivering').length;
}
function countActiveOrders(orders) {
    return orders.filter((o) => o.status === 'assigned' || o.status === 'delivering').length;
}
/**
 * Driver status rules:
 * - off: unchanged unless explicitly set
 * - delivering: ≥1 order with status delivering
 * - standby: has assigned-only OR no active orders (and not off)
 */
function resolveDriverStatusFromOrders(activeOrders, currentStatus) {
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
//# sourceMappingURL=statusMapping.js.map