import { config } from '../config';
import { Driver } from '../types';
import {
  mapOrderStatusToSpreadsheet,
  SpreadsheetOrderAction,
} from '../utils/statusMapping';

const DEFAULT_SPREADSHEET_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';

function getSpreadsheetWebhookUrl(): string {
  return config.spreadsheet?.webhookUrl || DEFAULT_SPREADSHEET_WEBHOOK_URL;
}

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

export class SpreadsheetService {
  private static buildPayload(orderCode: string, status: string): URLSearchParams {
    const payload = new URLSearchParams();
    payload.set('api', 'updateStatus');
    payload.set('no_order', orderCode);
    payload.set('status', status);
    return payload;
  }

  private static async sendUpdateRequest(payload: URLSearchParams): Promise<{
    ok: boolean;
    status: number;
    body: string;
  }> {
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

  private static parseAppsScriptSuccess(body: string): boolean {
    try {
      const parsed = JSON.parse(body) as { success?: boolean; message?: string };
      if (typeof parsed.success === 'boolean') {
        return parsed.success;
      }
      return !parsed.message?.toLowerCase().includes('tidak ditemukan');
    } catch {
      return body.toLowerCase().includes('berhasil') || body.toLowerCase().includes('diperbarui');
    }
  }

  private static orderCodeVariants(orderCode: string): string[] {
    const normalized = orderCode.trim();
    return Array.from(
      new Set([normalized, normalized.toUpperCase(), normalized.replace(/\s+/g, '')])
    ).filter(Boolean);
  }

  /**
   * Sync order status to Google Apps Script (SC-A8: doGet api=updateStatus).
   */
  static async syncOrderStatus(
    orderCode: string,
    action: SpreadsheetOrderAction,
    driver: Pick<Driver, 'nama_driver'>,
    context?: { previousStatus?: string }
  ): Promise<SpreadsheetUpdateResult> {
    const nextStatus = mapOrderStatusToSpreadsheet(action, driver);
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
      } catch (error) {
        console.error(`❌ Spreadsheet sync exception for ${candidate}:`, error);
      }
    }

    const failure: SpreadsheetUpdateResult = {
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
  static async updateOrderStatus(
    orderCode: string,
    status: string,
    driver?: Pick<Driver, 'nama_driver'>
  ): Promise<boolean> {
    if (!driver) {
      console.warn('⚠️ updateOrderStatus called without driver — use syncOrderStatus instead');
      const payload = this.buildPayload(orderCode, status);
      const result = await this.sendUpdateRequest(payload);
      return result.ok && this.parseAppsScriptSuccess(result.body);
    }

    let action: SpreadsheetOrderAction = 'order_assigned';
    if (status.toLowerCase().includes('antar') || status === 'siap') {
      action = 'order_delivering';
    } else if (status.toLowerCase().includes('selesai') || status.toLowerCase().includes('diantar')) {
      action = 'order_completed';
    }

    const result = await this.syncOrderStatus(orderCode, action, driver);
    return result.success;
  }
}

export default SpreadsheetService;
