export type DriverStatus = 'off' | 'standby' | 'assigned' | 'delivering';
export type OrderStatus = 'waiting_driver' | 'assigned' | 'delivering' | 'completed';
export type RegistrationState = 'waiting_name' | 'waiting_driver_code' | 'waiting_wa' | 'waiting_initial_status' | 'completed';
export type EmployeeRegistrationState = 'waiting_employee_name' | 'waiting_employee_code' | 'waiting_employee_wa' | 'waiting_rekening' | 'employee_completed';
export type AdminScheduleState = 'waiting_shift_limit';
export type SessionFlow = 'driver' | 'employee' | 'admin_schedule';
export type ShiftType = 'pagi' | 'siang';
export type VerificationCodeType = 'driver' | 'employee';
export type SwapRequestStatus = 'open' | 'completed';
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
export interface Employee {
    id?: number;
    telegram_id: string;
    nama: string;
    no_wa: string;
    rekening_info: string;
    is_verified?: boolean;
    created_at?: string;
}
export interface VerificationCode {
    code: string;
    type: VerificationCodeType;
    is_used: boolean;
    created_at?: string;
}
export interface Schedule {
    id?: number;
    tanggal: string;
    shift: ShiftType;
    employee_id: number;
    created_at?: string;
    employees?: Employee | Employee[];
}
export interface GeneralCleaningLog {
    id?: number;
    tanggal: string;
    employee_id: number;
    created_at?: string;
    employees?: Employee | Employee[];
}
export interface SwapRequest {
    id?: number;
    schedule_id: number;
    requester_id: number;
    status: SwapRequestStatus;
    created_at?: string;
}
export interface PayrollEntry {
    nama: string;
    totalShifts: number;
    gcCount: number;
    totalGaji: number;
    rekeningInfo: string;
}
export interface UserSession {
    telegramId: string;
    flow: SessionFlow;
    state: RegistrationState | EmployeeRegistrationState | AdminScheduleState;
    data: {
        name?: string;
        driverCode?: string;
        whatsapp?: string;
        employeeCode?: string;
        rekening?: string;
        shiftLimit?: number;
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
    action: 'take_order' | 'start_delivery' | 'complete_delivery' | 'set_status' | 'view_active_orders' | 'request_swap' | 'take_shift' | 'swap_shift' | 'take_gc';
    orderId?: string;
    status?: DriverStatus;
    scheduleId?: number;
    swapRequestId?: number;
    gcMessageId?: number;
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