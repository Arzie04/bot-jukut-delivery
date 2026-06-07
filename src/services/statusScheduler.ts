import SupabaseService from './supabase';

class StatusSchedulerService {
  private static timer: NodeJS.Timeout | null = null;
  private static lastRunKey = '';
  private static readonly intervalMs = 60000;

  static start(): void {
    if (this.timer) return;
    this.check();
    this.timer = setInterval(() => this.check(), this.intervalMs);
    console.log('⏰ Auto-off scheduler started');
  }

  static stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    console.log('🛑 Auto-off scheduler stopped');
  }

  private static async check(): Promise<void> {
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    if (now.getHours() !== 22 || now.getMinutes() !== 0 || this.lastRunKey === key) {
      return;
    }

    const response = await SupabaseService.updateAllDriversStatus('off');
    if (!response.success) {
      console.error('❌ Auto-off failed:', response.error);
      return;
    }

    this.lastRunKey = key;
    console.log(`✅ Auto-off success: ${response.data?.length || 0} driver(s) switched to off`);
  }
}

export default StatusSchedulerService;
