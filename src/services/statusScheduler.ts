import type TelegramBot from 'node-telegram-bot-api';
import MessageUtils from '../utils/messages';
import SupabaseService from './supabase';

class StatusSchedulerService {
  private static timer: NodeJS.Timeout | null = null;
  private static bot: TelegramBot | null = null;
  private static lastRunKey = '';
  private static readonly intervalMs = 60000; // Check every minute

  static start(bot: TelegramBot): void {
    if (this.timer) return;
    this.bot = bot;
    this.check(); // Initial check
    this.timer = setInterval(() => this.check(), this.intervalMs);
    console.log('⏰ Auto-off scheduler started');
  }

  static stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this.bot = null;
    console.log('🛑 Auto-off scheduler stopped');
  }

  private static async check(): Promise<void> {
    if (!this.bot) return;

    const now = new Date();
    // Use local time for checking
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Generate a key for today's date to ensure it only runs once per day
    const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    // Check if it's 21:30 and if it has already run today
    if (hours !== 21 || minutes !== 30 || this.lastRunKey === key) {
      return;
    }

    console.log('🌙 Running daily auto-off job...');

    try {
      // 1. Get all drivers who are currently 'standby'
      const standbyDriversResponse = await SupabaseService.getDriversByStatus('standby');
      if (!standbyDriversResponse.success) {
        console.error('❌ Auto-off: Failed to get standby drivers:', standbyDriversResponse.error);
        return;
      }
      const standbyDrivers = standbyDriversResponse.data || [];

      // 2. Set all drivers to 'off'
      const updateResponse = await SupabaseService.updateAllDriversStatus('off');
      if (!updateResponse.success) {
        console.error('❌ Auto-off: Failed to update driver statuses:', updateResponse.error);
        return;
      }
      
      this.lastRunKey = key; // Mark as run for today
      console.log(`✅ Auto-off success: ${updateResponse.data?.length || 0} driver(s) switched to off.`);

      // 3. Broadcast notification to the drivers who were previously standby
      if (standbyDrivers.length > 0) {
        console.log(`📢 Broadcasting auto-off message to ${standbyDrivers.length} standby driver(s)...`);
        const message = MessageUtils.getAutoOffMessage();
        for (const driver of standbyDrivers) {
          if (driver.telegram_id) {
            try {
              await this.bot.sendMessage(driver.telegram_id, message);
            } catch (error) {
              console.error(`❌ Auto-off: Failed to send message to ${driver.telegram_id}`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error in auto-off job:', error);
    }
  }
}

export default StatusSchedulerService;

