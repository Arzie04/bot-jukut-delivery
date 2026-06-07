"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = __importDefault(require("./supabase"));
class StatusSchedulerService {
    static timer = null;
    static lastRunKey = '';
    static intervalMs = 60000;
    static start() {
        if (this.timer)
            return;
        this.check();
        this.timer = setInterval(() => this.check(), this.intervalMs);
        console.log('⏰ Auto-off scheduler started');
    }
    static stop() {
        if (!this.timer)
            return;
        clearInterval(this.timer);
        this.timer = null;
        console.log('🛑 Auto-off scheduler stopped');
    }
    static async check() {
        const now = new Date();
        const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        if (now.getHours() !== 22 || now.getMinutes() !== 0 || this.lastRunKey === key) {
            return;
        }
        const response = await supabase_1.default.updateAllDriversStatus('off');
        if (!response.success) {
            console.error('❌ Auto-off failed:', response.error);
            return;
        }
        this.lastRunKey = key;
        console.log(`✅ Auto-off success: ${response.data?.length || 0} driver(s) switched to off`);
    }
}
exports.default = StatusSchedulerService;
//# sourceMappingURL=statusScheduler.js.map