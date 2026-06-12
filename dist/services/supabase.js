"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
// Create Supabase client
const supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceRoleKey);
class SupabaseService {
    // Driver operations
    static async getDriverByTelegramId(telegramId) {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('telegram_id', telegramId)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error getting driver:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || null };
        }
        catch (error) {
            console.error('❌ Error getting driver:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async createDriver(driver) {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .insert([driver])
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating driver:', error);
                return { success: false, error: error.message };
            }
            console.log('✅ Driver created:', data);
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error creating driver:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async updateDriverStatus(telegramId, status) {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('telegram_id', telegramId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error updating driver status:', error);
                return { success: false, error: error.message };
            }
            console.log(`✅ Driver status updated to ${status}:`, data);
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error updating driver status:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getAllDrivers() {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*');
            if (error) {
                console.error('❌ Error getting all drivers:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting all drivers:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getDriversByStatus(status) {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('status', status);
            if (error) {
                console.error(`❌ Error getting drivers with status ${status}:`, error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error(`❌ Error getting drivers with status ${status}:`, error);
            return { success: false, error: 'Database error' };
        }
    }
    static async updateAllDriversStatus(status) {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .update({ status, updated_at: new Date().toISOString() })
                .neq('status', status)
                .select('*');
            if (error) {
                console.error('❌ Error updating all drivers status:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error updating all drivers status:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getEligibleDriversForBroadcast() {
        try {
            const { data: drivers, error: driversError } = await supabase
                .from('drivers')
                .select('*')
                .neq('status', 'off');
            if (driversError) {
                console.error('❌ Error getting eligible drivers:', driversError);
                return { success: false, error: driversError.message };
            }
            const { data: activeOrders, error: ordersError } = await supabase
                .from('delivery_orders')
                .select('assigned_driver')
                .in('status', ['assigned', 'delivering'])
                .not('assigned_driver', 'is', null);
            if (ordersError) {
                console.error('❌ Error getting active orders for broadcast:', ordersError);
                return { success: false, error: ordersError.message };
            }
            const activeCounts = {};
            activeOrders?.forEach(order => {
                if (order.assigned_driver) {
                    activeCounts[order.assigned_driver] = (activeCounts[order.assigned_driver] || 0) + 1;
                }
            });
            const eligibleDrivers = drivers?.filter(driver => {
                const count = activeCounts[driver.id] || 0;
                return count < 5;
            });
            return { success: true, data: eligibleDrivers || [] };
        }
        catch (error) {
            console.error('❌ Error getting eligible drivers for broadcast:', error);
            return { success: false, error: 'Database error' };
        }
    }
    // Driver code operations
    static async validateDriverCode(code) {
        try {
            const { data, error } = await supabase
                .from('driver_codes')
                .select('*')
                .eq('kode', code)
                .eq('is_used', false)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error validating driver code:', error);
                return { success: false, error: error.message };
            }
            if (!data) {
                return { success: false, error: 'Kode driver tidak valid atau sudah digunakan' };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error validating driver code:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async markDriverCodeAsUsed(code, usedBy) {
        try {
            const { data, error } = await supabase
                .from('driver_codes')
                .update({ is_used: true, used_by: usedBy })
                .eq('kode', code)
                .select()
                .single();
            if (error) {
                console.error('❌ Error marking driver code as used:', error);
                return { success: false, error: error.message };
            }
            console.log('✅ Driver code marked as used:', data);
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error marking driver code as used:', error);
            return { success: false, error: 'Database error' };
        }
    }
    // Delivery order operations
    static async getRecentOrders(limit = 20) {
        try {
            const { data, error } = await supabase
                .from('delivery_orders')
                .select('*, drivers(nama_driver)')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('❌ Error getting recent orders:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting recent orders:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getWaitingOrders() {
        try {
            const { data, error } = await supabase
                .from('delivery_orders')
                .select('*')
                .eq('status', 'waiting_driver')
                .order('created_at', { ascending: true });
            if (error) {
                console.error('❌ Error getting waiting orders:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting waiting orders:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async assignOrderToDriver(orderId, driverId) {
        try {
            const { data, error } = await supabase
                .from('delivery_orders')
                .update({
                status: 'assigned',
                assigned_driver: driverId,
                updated_at: new Date().toISOString()
            })
                .eq('order_code', orderId)
                .eq('status', 'waiting_driver') // Only assign if still waiting
                .select()
                .single();
            if (error) {
                console.error('❌ Error assigning order:', error);
                return { success: false, error: error.message };
            }
            if (!data) {
                return { success: false, error: 'Order sudah diambil driver lain' };
            }
            console.log('✅ Order assigned to driver:', data);
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error assigning order:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async updateOrderStatus(orderId, status) {
        try {
            const { data, error } = await supabase
                .from('delivery_orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('order_code', orderId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error updating order status:', error);
                return { success: false, error: error.message };
            }
            console.log(`✅ Order status updated to ${status}:`, data);
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error updating order status:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getDriverActiveOrders(driverId) {
        try {
            const { data, error } = await supabase
                .from('delivery_orders')
                .select('*')
                .eq('assigned_driver', driverId)
                .in('status', ['assigned', 'delivering'])
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting driver active orders:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting driver active orders:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getDriverStats(driverId) {
        try {
            // Get total deliveries
            const { count: totalDeliveries, error: totalError } = await supabase
                .from('delivery_orders')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_driver', driverId)
                .eq('status', 'completed');
            if (totalError) {
                console.error('❌ Error getting total deliveries:', totalError);
                return { success: false, error: totalError.message };
            }
            // Get active deliveries
            const { count: activeDeliveries, error: activeError } = await supabase
                .from('delivery_orders')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_driver', driverId)
                .in('status', ['assigned', 'delivering']);
            if (activeError) {
                console.error('❌ Error getting active deliveries:', activeError);
                return { success: false, error: activeError.message };
            }
            // Get completed today
            const today = new Date().toISOString().split('T')[0];
            const { count: completedToday, error: todayError } = await supabase
                .from('delivery_orders')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_driver', driverId)
                .eq('status', 'completed')
                .gte('updated_at', `${today}T00:00:00.000Z`)
                .lt('updated_at', `${today}T23:59:59.999Z`);
            if (todayError) {
                console.error('❌ Error getting completed today:', todayError);
                return { success: false, error: todayError.message };
            }
            // Get today's income (sum of delivery_fee from completed orders)
            const { data: todayCompletedOrders, error: incomeError } = await supabase
                .from('delivery_orders')
                .select('delivery_fee')
                .eq('assigned_driver', driverId)
                .eq('status', 'completed')
                .gte('updated_at', `${today}T00:00:00.000Z`)
                .lt('updated_at', `${today}T23:59:59.999Z`);
            if (incomeError) {
                console.error('❌ Error getting income today:', incomeError);
                return { success: false, error: incomeError.message };
            }
            const totalIncomeToday = (todayCompletedOrders || []).reduce((sum, order) => {
                const fee = Number(order.delivery_fee || 0);
                return sum + fee;
            }, 0);
            return {
                success: true,
                data: {
                    totalDeliveries: totalDeliveries || 0,
                    activeDeliveries: activeDeliveries || 0,
                    completedToday: completedToday || 0,
                    totalIncomeToday,
                }
            };
        }
        catch (error) {
            console.error('❌ Error getting driver stats:', error);
            return { success: false, error: 'Database error' };
        }
    }
    // ============== EMPLOYEE OPERATIONS ==============
    static async getEmployeeByTelegramId(telegramId) {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('telegram_id', telegramId)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error getting employee:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || null };
        }
        catch (error) {
            console.error('❌ Error getting employee:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async createEmployee(employee) {
        try {
            const { data, error } = await supabase
                .from('employees')
                .insert([employee])
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating employee:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error creating employee:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getEmployeeById(employeeId) {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', employeeId)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error getting employee by id:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || null };
        }
        catch (error) {
            console.error('❌ Error getting employee by id:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getVerifiedEmployees() {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('is_verified', true);
            if (error) {
                console.error('❌ Error getting verified employees:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting verified employees:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async validateVerificationCode(code, type) {
        try {
            const { data, error } = await supabase
                .from('verification_codes')
                .select('*')
                .eq('code', code)
                .eq('type', type)
                .eq('is_used', false)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error validating verification code:', error);
                return { success: false, error: error.message };
            }
            if (!data) {
                return { success: false, error: 'Kode verifikasi tidak valid atau sudah digunakan' };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error validating verification code:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async markVerificationCodeAsUsed(code) {
        try {
            const { data, error } = await supabase
                .from('verification_codes')
                .update({ is_used: true })
                .eq('code', code)
                .select()
                .single();
            if (error) {
                console.error('❌ Error marking verification code as used:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error marking verification code as used:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async createVerificationCode(type) {
        try {
            const code = this.generateRandomCode();
            const { data, error } = await supabase
                .from('verification_codes')
                .insert([{ code, type, is_used: false }])
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating verification code:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error creating verification code:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static generateRandomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    static async getSchedulesForWeek(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*, employees(id, nama, telegram_id)')
                .gte('tanggal', startDate)
                .lte('tanggal', endDate)
                .order('tanggal', { ascending: true })
                .order('shift', { ascending: true });
            if (error) {
                console.error('❌ Error getting schedules:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting schedules:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async replaceWeekSchedules(startDate, endDate, schedules) {
        try {
            const { error: deleteError } = await supabase
                .from('schedules')
                .delete()
                .gte('tanggal', startDate)
                .lte('tanggal', endDate);
            if (deleteError) {
                console.error('❌ Error deleting old schedules:', deleteError);
                return { success: false, error: deleteError.message };
            }
            if (schedules.length === 0) {
                return { success: true, data: [] };
            }
            const { data, error } = await supabase
                .from('schedules')
                .insert(schedules)
                .select('*, employees(id, nama, telegram_id)');
            if (error) {
                console.error('❌ Error inserting schedules:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error replacing week schedules:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getScheduleById(scheduleId) {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*, employees(id, nama, telegram_id)')
                .eq('id', scheduleId)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error getting schedule:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || null };
        }
        catch (error) {
            console.error('❌ Error getting schedule:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async updateScheduleEmployee(scheduleId, employeeId) {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .update({ employee_id: employeeId })
                .eq('id', scheduleId)
                .select('*, employees(id, nama, telegram_id)')
                .single();
            if (error) {
                console.error('❌ Error updating schedule employee:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error updating schedule employee:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getEmployeeFutureSchedules(employeeId, fromDate) {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*, employees(id, nama, telegram_id)')
                .eq('employee_id', employeeId)
                .gte('tanggal', fromDate)
                .order('tanggal', { ascending: true });
            if (error) {
                console.error('❌ Error getting future schedules:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting future schedules:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async createSwapRequest(scheduleId, requesterId) {
        try {
            const { data, error } = await supabase
                .from('swap_requests')
                .insert([{ schedule_id: scheduleId, requester_id: requesterId, status: 'open' }])
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating swap request:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error creating swap request:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getSwapRequestById(id) {
        try {
            const { data, error } = await supabase
                .from('swap_requests')
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error getting swap request:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || null };
        }
        catch (error) {
            console.error('❌ Error getting swap request:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async completeSwapRequest(id) {
        try {
            const { data, error } = await supabase
                .from('swap_requests')
                .update({ status: 'completed' })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('❌ Error completing swap request:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error completing swap request:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async createGeneralCleaningLog(tanggal, employeeId) {
        try {
            const { data, error } = await supabase
                .from('general_cleaning_logs')
                .insert([{ tanggal, employee_id: employeeId }])
                .select('*, employees(id, nama)')
                .single();
            if (error) {
                console.error('❌ Error creating GC log:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }
        catch (error) {
            console.error('❌ Error creating GC log:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async hasEmployeeTakenGcOnDate(employeeId, tanggal) {
        try {
            const { count, error } = await supabase
                .from('general_cleaning_logs')
                .select('*', { count: 'exact', head: true })
                .eq('tanggal', tanggal)
                .eq('employee_id', employeeId);
            if (error) {
                console.error('❌ Error checking GC log:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: (count || 0) > 0 };
        }
        catch (error) {
            console.error('❌ Error checking GC log:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async countGeneralCleaningForDate(tanggal) {
        try {
            const { count, error } = await supabase
                .from('general_cleaning_logs')
                .select('*', { count: 'exact', head: true })
                .eq('tanggal', tanggal);
            if (error) {
                console.error('❌ Error counting GC logs:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: count || 0 };
        }
        catch (error) {
            console.error('❌ Error counting GC logs:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getGeneralCleaningLogsForWeek(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('general_cleaning_logs')
                .select('*, employees(id, nama, rekening_info)')
                .gte('tanggal', startDate)
                .lte('tanggal', endDate);
            if (error) {
                console.error('❌ Error getting GC logs:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting GC logs:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getWeeklyPayroll(startDate, endDate) {
        try {
            const schedulesRes = await this.getSchedulesForWeek(startDate, endDate);
            if (!schedulesRes.success) {
                return { success: false, error: schedulesRes.error || 'Gagal mengambil jadwal' };
            }
            const gcRes = await this.getGeneralCleaningLogsForWeek(startDate, endDate);
            if (!gcRes.success) {
                return { success: false, error: gcRes.error || 'Gagal mengambil log GC' };
            }
            const employeesRes = await this.getVerifiedEmployees();
            if (!employeesRes.success) {
                return { success: false, error: employeesRes.error || 'Gagal mengambil karyawan' };
            }
            const shiftPay = 45000;
            const shiftCounts = {};
            const gcCounts = {};
            for (const s of schedulesRes.data || []) {
                shiftCounts[s.employee_id] = (shiftCounts[s.employee_id] || 0) + 1;
            }
            for (const log of gcRes.data || []) {
                gcCounts[log.employee_id] = (gcCounts[log.employee_id] || 0) + 1;
            }
            const payroll = (employeesRes.data || [])
                .filter((e) => e.id && ((shiftCounts[e.id] || 0) > 0 || (gcCounts[e.id] || 0) > 0))
                .map((e) => {
                const shifts = shiftCounts[e.id] || 0;
                const gc = gcCounts[e.id] || 0;
                return {
                    nama: e.nama,
                    totalShifts: shifts,
                    gcCount: gc,
                    totalGaji: shifts * shiftPay,
                    rekeningInfo: e.rekening_info,
                };
            })
                .sort((a, b) => a.nama.localeCompare(b.nama));
            return { success: true, data: payroll };
        }
        catch (error) {
            console.error('❌ Error calculating payroll:', error);
            return { success: false, error: 'Database error' };
        }
    }
    static async getTodaysIncomeByDriver() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const { data: orders, error } = await supabase
                .from('delivery_orders')
                .select('delivery_fee, drivers(id, nama_driver)')
                .eq('status', 'completed')
                .not('assigned_driver', 'is', null)
                .gte('updated_at', today.toISOString())
                .lt('updated_at', tomorrow.toISOString());
            if (error) {
                console.error('❌ Error getting today\'s completed orders:', error);
                return { success: false, error: error.message };
            }
            if (!orders) {
                return { success: true, data: [] };
            }
            const incomeMap = new Map();
            for (const order of orders) {
                // The result from Supabase with a join can be an array or a single object
                const driverInfo = Array.isArray(order.drivers) ? order.drivers[0] : order.drivers;
                if (driverInfo && driverInfo.nama_driver) {
                    const currentIncome = incomeMap.get(driverInfo.nama_driver) || 0;
                    incomeMap.set(driverInfo.nama_driver, currentIncome + (order.delivery_fee || 0));
                }
            }
            const result = Array.from(incomeMap.entries())
                .map(([driverName, totalIncome]) => ({ driverName, totalIncome }))
                .filter(item => item.totalIncome > 0); // Filter out drivers with 0 income
            return { success: true, data: result };
        }
        catch (error) {
            console.error('❌ Error in getTodaysIncomeByDriver:', error);
            return { success: false, error: 'Database error' };
        }
    }
}
exports.SupabaseService = SupabaseService;
exports.default = SupabaseService;
//# sourceMappingURL=supabase.js.map