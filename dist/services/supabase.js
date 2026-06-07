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
}
exports.SupabaseService = SupabaseService;
exports.default = SupabaseService;
//# sourceMappingURL=supabase.js.map