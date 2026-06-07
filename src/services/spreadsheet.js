"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpreadsheetService = void 0;
const config_1 = require("../config");
const types_1 = require("../types");
const statusMapping_1 = require("../utils/statusMapping");
const DEFAULT_SPREADSHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';
function getSpreadsheetWebhookUrl() {
    return config_1.config.spreadsheet?.webhookUrl || DEFAULT_SPREADSHEET_WEBHOOK_URL;
}
class SpreadsheetService {
    static buildPayload(orderCode, status) {
        const payload = new URLSearchParams();
        payload.set('api', 'updateStatus');
        payload.set('no_order', orderCode);
        payload.set('status', status);
        return payload;
    }
    static async sendUpdateRequest(payload) {
        const baseUrl = getSpreadsheetWebhookUrl();
        const queryUrl = `${baseUrl}?${payload.toString()}`;
        console.log('📤 Spreadsheet endpoint:', baseUrl);
        console.log('📤 Spreadsheet payload:', Object.fromEntries(payload.entries()));
        const response = await fetch(queryUrl, { method: 'GET' });
        const body = await response.text();
        console.log('📥 Spreadsheet HTTP status:', response.status);
        console.log('📥 Spreadsheet response body:', body);
        return { ok: response.ok, status: response.status, body };
    }
    static parseAppsScriptSuccess(body) {
        try {
            const parsed = JSON.parse(body);
            if (typeof parsed.success === 'boolean') {
                return parsed.success;
            }
            return !parsed.message?.toLowerCase().includes('tidak ditemukan');
        }
        catch {
            return body.toLowerCase().includes('berhasil') || body.toLowerCase().includes('diperbarui');
        }
    }
    static orderCodeVariants(orderCode) {
        const normalized = orderCode.trim();
        return Array.from(new Set([normalized, normalized.toUpperCase(), normalized.replace(/\s+/g, '')])).filter(Boolean);
    }
    /**
     * Sync order status to Google Apps Script (SC-A8: doGet api=updateStatus).
     */
    static async syncOrderStatus(orderCode, action, driver, context) {
        const nextStatus = (0, statusMapping_1.mapOrderStatusToSpreadsheet)(action, driver);
        const driverName = driver.nama_driver;
        console.log('🔄 Spreadsheet sync start:', {
            orderCode,
            action,
            driverName,
            previousStatus: context?.previousStatus ?? '(unknown)',
            nextStatus,
        });
        for (const candidate of this.orderCodeVariants(orderCode)) {
            try {
                const payload = this.buildPayload(candidate, nextStatus);
                const result = await this.sendUpdateRequest(payload);
                const appsScriptOk = this.parseAppsScriptSuccess(result.body);
                if (!result.ok || !appsScriptOk) {
                    console.error('❌ Spreadsheet sync rejected:', {
                        orderCode: candidate,
                        httpStatus: result.status,
                        responseBody: result.body,
                    });
                    continue;
                }
                console.log('✅ Spreadsheet sync confirmed:', {
                    orderCode: candidate,
                    driverName,
                    nextStatus,
                });
                return {
                    success: true,
                    orderCode: candidate,
                    previousStatus: context?.previousStatus,
                    nextStatus,
                    driverName,
                    httpStatus: result.status,
                    responseBody: result.body,
                };
            }
            catch (error) {
                console.error(`❌ Spreadsheet sync exception for ${candidate}:`, error);
            }
        }
        const failure = {
            success: false,
            orderCode,
            previousStatus: context?.previousStatus,
            nextStatus,
            driverName,
            error: 'All order code variants failed',
        };
        console.error('❌ Spreadsheet sync failed:', failure);
        return failure;
    }
    /** @deprecated Use syncOrderStatus — kept for backward compatibility */
    static async updateOrderStatus(orderCode, status, driver) {
        if (!driver) {
            console.warn('⚠️ updateOrderStatus called without driver — use syncOrderStatus instead');
            const payload = this.buildPayload(orderCode, status);
            const result = await this.sendUpdateRequest(payload);
            return result.ok && this.parseAppsScriptSuccess(result.body);
        }
        let action = 'order_assigned';
        if (status.toLowerCase().includes('antar') || status === 'siap') {
            action = 'order_delivering';
        }
        else if (status.toLowerCase().includes('selesai') || status.toLowerCase().includes('diantar')) {
            action = 'order_completed';
        }
        const result = await this.syncOrderStatus(orderCode, action, driver);
        return result.success;
    }
}
exports.SpreadsheetService = SpreadsheetService;
exports.default = SpreadsheetService;
//# sourceMappingURL=spreadsheet.js.map