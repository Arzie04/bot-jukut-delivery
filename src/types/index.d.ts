export type DriverStatus = 'off' | 'standby' | 'assigned' | 'delivering';
export type OrderStatus = 'waiting_driver' | 'assigned' | 'delivering' | 'completed';
export type RegistrationState = 'waiting_name' | 'waiting_driver_code' | 'waiting_wa' | 'waiting_initial_status' | 'completed';
export interface Driver {
    id?: number;
    telegram_id: string;
    telegram_username?: string;
    nama_driver: string;
    kode_driver: string;
    whatsapp: string;
    status: DriverStatus;
    created_at?: string;
    updated_at?: string;
}
export interface DriverCode {
    id: number;
    code: string;
    is_used: boolean;
    created_at: string;
}
export interface DeliveryOrder {
    id: number;
    order_id: string;
    customer_name: string;
    items: string;
    distance_km: number;
    eta_minutes: number;
    location: string;
    status: OrderStatus;
    driver_id?: number;
    created_at: string;
    updated_at: string;
}
export interface UserSession {
    telegramId: string;
    state: RegistrationState;
    data: {
        name?: string;
        driverCode?: string;
        whatsapp?: string;
    };
}
export interface OrderBroadcastMessage {
    orderId: string;
    customerName: string;
    items: string;
    distance: number;
    eta: number;
    location: string;
}
export interface CallbackData {
    action: 'take_order' | 'start_delivery' | 'complete_delivery' | 'set_status';
    orderId?: string;
    status?: DriverStatus;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface SupabaseResponse<T> {
    data: T | null;
    error: any;
}
export interface DriverStats {
    totalDeliveries: number;
    activeDeliveries: number;
    completedToday: number;
}
//# sourceMappingURL=index.d.ts.map