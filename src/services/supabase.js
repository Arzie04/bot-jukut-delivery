"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
const types_1 = require("../types");
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
    static async getStandbyDrivers() {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('status', 'standby');
            if (error) {
                console.error('❌ Error getting standby drivers:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data || [] };
        }
        catch (error) {
            console.error('❌ Error getting standby drivers:', error);
            return { success: false, error: 'Database error' };
        }
    }
    // Driver code operations
    static async validateDriverCode(code) {
        try {
            const { data, error } = await supabase
                .from('driver_codes')
                .select('*')
                .eq('code', code)
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
    static async markDriverCodeAsUsed(code) {
        try {
            const { data, error } = await supabase
                .from('driver_codes')
                .update({ is_used: true })
                .eq('code', code)
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
                driver_id: driverId,
                updated_at: new Date().toISOString()
            })
                .eq('order_id', orderId)
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
                .eq('order_id', orderId)
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
                .eq('driver_id', driverId)
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
                .eq('driver_id', driverId)
                .eq('status', 'completed');
            if (totalError) {
                console.error('❌ Error getting total deliveries:', totalError);
                return { success: false, error: totalError.message };
            }
            // Get active deliveries
            const { count: activeDeliveries, error: activeError } = await supabase
                .from('delivery_orders')
                .select('*', { count: 'exact', head: true })
                .eq('driver_id', driverId)
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
                .eq('driver_id', driverId)
                .eq('status', 'completed')
                .gte('updated_at', `${today}T00:00:00.000Z`)
                .lt('updated_at', `${today}T23:59:59.999Z`);
            if (todayError) {
                console.error('❌ Error getting completed today:', todayError);
                return { success: false, error: todayError.message };
            }
            return {
                success: true,
                data: {
                    totalDeliveries: totalDeliveries || 0,
                    activeDeliveries: activeDeliveries || 0,
                    completedToday: completedToday || 0,
                }
            };
        }
        catch (error) {
            console.error('❌ Error getting driver stats:', error);
            return { success: false, error: 'Database error' };
        }
    }
}
exports.SupabaseService = SupabaseService;
exports.default = SupabaseService;
//# sourceMappingURL=supabase.js.map