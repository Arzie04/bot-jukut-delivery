export type DriverStatus = 'off' | 'standby' | 'assigned' | 'delivering';
export type OrderStatus = 'waiting_driver' | 'assigned' | 'delivering' | 'completed';
export type RegistrationState = 'waiting_name' | 'waiting_driver_code' | 'waiting_wa' | 'waiting_initial_status' | 'completed';
export interface Driver {
    id?: number;
    telegram_id: string;
    telegram_username?: string;
    nama_driver: string;
    kode_driver: string;
    nomor_wa: string;
    is_verified?: boolean;
    status: DriverStatus;
    created_at?: string;
    updated_at?: string;
}
export interface DriverCode {
    id: number;
    kode: string;
    is_used: boolean;
    used_by?: number;
    created_at: string;
}
export interface DeliveryOrder {
    id: number;
    order_code: string;
    costumer_name: string;
    costumer_wa: string;
    items: string;
    total_price: number;
    delivery_fee: number;
    distance_km: number;
    maps_link: string;
    note_driver?: string;
    status: OrderStatus;
    assigned_driver?: number;
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
    mapsLink: string;
}
export interface CallbackData {
    action: 'take_order' | 'start_delivery' | 'complete_delivery' | 'set_status' | 'view_active_orders';
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