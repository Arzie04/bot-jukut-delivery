import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { Driver, DriverCode, DeliveryOrder, DriverStatus, OrderStatus, ApiResponse } from '../types';

// Create Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

export class SupabaseService {
  // Driver operations
  static async getDriverByTelegramId(telegramId: string): Promise<ApiResponse<Driver>> {
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
    } catch (error) {
      console.error('❌ Error getting driver:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async createDriver(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Driver>> {
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
    } catch (error) {
      console.error('❌ Error creating driver:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async updateDriverStatus(telegramId: string, status: DriverStatus): Promise<ApiResponse<Driver>> {
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
    } catch (error) {
      console.error('❌ Error updating driver status:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async getAllDrivers(): Promise<ApiResponse<Driver[]>> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*');

      if (error) {
        console.error('❌ Error getting all drivers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error getting all drivers:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async getDriversByStatus(status: DriverStatus): Promise<ApiResponse<Driver[]>> {
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
    } catch (error) {
      console.error(`❌ Error getting drivers with status ${status}:`, error);
      return { success: false, error: 'Database error' };
    }
  }

  static async updateAllDriversStatus(status: DriverStatus): Promise<ApiResponse<Driver[]>> {
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
    } catch (error) {
      console.error('❌ Error updating all drivers status:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async getEligibleDriversForBroadcast(): Promise<ApiResponse<Driver[]>> {
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

      const activeCounts: Record<number, number> = {};
      activeOrders?.forEach(order => {
        if (order.assigned_driver) {
          activeCounts[order.assigned_driver] = (activeCounts[order.assigned_driver] || 0) + 1;
        }
      });

      const eligibleDrivers = drivers?.filter(driver => {
        const count = activeCounts[driver.id!] || 0;
        return count < 5;
      });

      return { success: true, data: eligibleDrivers || [] };
    } catch (error) {
      console.error('❌ Error getting eligible drivers for broadcast:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Driver code operations
  static async validateDriverCode(code: string): Promise<ApiResponse<DriverCode>> {
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
    } catch (error) {
      console.error('❌ Error validating driver code:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async markDriverCodeAsUsed(code: string, usedBy?: number): Promise<ApiResponse<DriverCode>> {
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
    } catch (error) {
      console.error('❌ Error marking driver code as used:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Delivery order operations
  static async getRecentOrders(limit = 20): Promise<ApiResponse<DeliveryOrder[]>> {
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
    } catch (error) {
      console.error('❌ Error getting recent orders:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async getWaitingOrders(): Promise<ApiResponse<DeliveryOrder[]>> {
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
    } catch (error) {
      console.error('❌ Error getting waiting orders:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async assignOrderToDriver(orderId: string, driverId: number): Promise<ApiResponse<DeliveryOrder>> {
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
    } catch (error) {
      console.error('❌ Error assigning order:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<DeliveryOrder>> {
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
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async getDriverActiveOrders(driverId: number): Promise<ApiResponse<DeliveryOrder[]>> {
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
    } catch (error) {
      console.error('❌ Error getting driver active orders:', error);
      return { success: false, error: 'Database error' };
    }
  }

  static async getDriverStats(driverId: number): Promise<ApiResponse<{ totalDeliveries: number; activeDeliveries: number; completedToday: number; totalIncomeToday: number }>> {
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
        const fee = Number((order as { delivery_fee?: number }).delivery_fee || 0);
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
    } catch (error) {
      console.error('❌ Error getting driver stats:', error);
      return { success: false, error: 'Database error' };
    }
  }
  static async getTodaysIncomeByDriver(): Promise<ApiResponse<{ driverName: string; totalIncome: number }[]>> {
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

      const incomeMap: Map<string, number> = new Map();

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
    } catch (error) {
      console.error('❌ Error in getTodaysIncomeByDriver:', error);
      return { success: false, error: 'Database error' };
    }
  }
}

export default SupabaseService;